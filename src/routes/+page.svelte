<script lang="ts">
	import type { PageData } from './$types';
	import { Alert, Button, Card, Checkbox, Heading, Label, P, Select } from 'flowbite-svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { Room } from 'livekit-client';
	import DeviceSelector from '$lib/components/device-selector.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/env';
	import CodecSelector from '$lib/components/codec-selector.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const activeSessions = data.sessions?.filter((session) => session.status === 'Started') || [];
	let selections = activeSessions.map((session) => {
		return {
			value: session.id,
			name: session.name
		};
	});
	let selected = $state(selections.length !== 0 ? selections[0].value : '');
	let identity = $state('');
	let userSelections = $state({
		audioDeviceIds: [],
		videoDeviceIds: [],
		videoCodec: '',
		videoPreset: '',
		audioPreset: '',
		noiseCancellation: true
	});
	const settings = data.settings;
	let devices = $state<MediaDeviceInfo[]>([]);

	onMount(async () => {
		if (browser) {
			const selections = window.localStorage.getItem('userSelections');
			if (selections) {
				userSelections = JSON.parse(selections);
				if (!Array.isArray(userSelections.audioDeviceIds)) {
					userSelections.audioDeviceIds = [];
				}

				if (!Array.isArray(userSelections.videoDeviceIds)) {
					userSelections.videoDeviceIds = [];
				}
			}

			if (!userSelections.videoPreset) {
				userSelections.videoPreset = 'h1080';
			}

			if (!userSelections.audioPreset) {
				userSelections.audioPreset = 'musicHighQuality';
			}

			if (!userSelections.videoCodec) {
				userSelections.videoCodec = 'h264';
			}

			if (typeof userSelections.noiseCancellation !== 'boolean') {
				userSelections.noiseCancellation = true;
			}

			devices = await Room.getLocalDevices();
		}
	});

	const deviceExists = (deviceId: string) => {
		if (browser) {
			return devices.map((d) => d.deviceId).includes(deviceId);
		} else {
			return false;
		}
	};

	$effect(() => {
		if (browser) {
			localStorage.setItem('userSelections', JSON.stringify(userSelections));
		}
	});

	let sharingState = $derived.by(() => {
		let missingDevices: string[] = [];
		let canShare = true;
		if (!identity) {
			canShare = false;
		}

		if (settings?.enableCamera && userSelections.videoDeviceIds.length != 0) {
			let missingVideoDevices = userSelections.videoDeviceIds.filter((id) => !deviceExists(id));
			if (missingVideoDevices.length > 0) {
				canShare = false;
				missingDevices.push(...missingVideoDevices);
			}
		}

		if (settings?.enableAudio && userSelections.audioDeviceIds.length != 0) {
			let missingAudioDevices = userSelections.audioDeviceIds.filter((id) => !deviceExists(id));

			if (missingAudioDevices.length > 0) {
				canShare = false;
				missingDevices.push(...missingAudioDevices);
			}
		}

		let sessionSharingErrors = null;

		if (missingDevices.length != 0) {
			sessionSharingErrors = `Please select audio/video devices before sharing. Devices with ${missingDevices.join(', ')} don't exist`;
		}

		return { canShare, sessionSharingErrors };
	});

	let canShareSession = $derived(sharingState.canShare);
	let sessionSharingErrors = $derived(sharingState.sessionSharingErrors);

	function getSelectedSessionName() {
		return selections.find((session) => session.value === selected)?.name;
	}
</script>

<div class="flex flex-col gap-6">
	<Heading tag="h1" class="text-3xl md:text-4xl">Share to a session</Heading>
	{#if data.error}
		<Alert color="red">
			{#snippet icon()}<ExclamationCircleOutline class="h-5 w-5" />{/snippet}
			<span class="font-medium">Couldn't fetch sessions from SyncFlow.</span>
			<pre class="mt-2 overflow-auto text-xs">{JSON.stringify(data.error, null, 2)}</pre>
		</Alert>
	{:else}
		<Card size="xl" class="p-4 sm:p-6">
			<DeviceSelector
				bind:audioDeviceIds={userSelections.audioDeviceIds}
				bind:videoDeviceIds={userSelections.videoDeviceIds}
			/>
		</Card>
		<Card size="xl" class="p-4 sm:p-6">
			<CodecSelector
				bind:selectedVideoCodec={userSelections.videoCodec}
				bind:selectedAudioPreset={userSelections.audioPreset}
				bind:selectedVideoPreset={userSelections.videoPreset}
			/>
		</Card>
		<Card size="xl" class="p-4 sm:p-6">
			<Heading tag="h2" class="text-xl">Audio options</Heading>
			<Checkbox class="mt-4" bind:checked={userSelections.noiseCancellation}>
				Enable noise cancellation
			</Checkbox>
		</Card>
		<Card size="xl" class="flex flex-col gap-4 p-4 sm:p-6">
			<Heading tag="h2" class="text-xl">Select a session</Heading>
			{#if selections.length !== 0}
				<form
					class="flex flex-col gap-4"
					method="POST"
					action="?/generateSessionToken"
					use:enhance={(/*params*/) => {
						return async ({ result }) => {
							if (result.type === 'success') {
								const tokenDetails = result.data?.token;
								if (tokenDetails) {
									let url = new URL('session', window.location.origin);
									url.searchParams.set('token', tokenDetails.token as string);
									url.searchParams.set('livekitUrl', tokenDetails.livekitServerUrl as string);
									url.searchParams.set('sessionName', getSelectedSessionName() || '');
									url.searchParams.set('sessionId', selected);
									url.searchParams.set('videoDeviceIds', userSelections.videoDeviceIds.join(','));
									url.searchParams.set('audioDeviceIds', userSelections.audioDeviceIds.join(','));
									url.searchParams.set('identity', identity);
									url.searchParams.set(
										'screenShareEnabled',
										settings?.enableScreenShare ? 'true' : 'false'
									);
									url.searchParams.set('enableCamera', settings?.enableCamera ? 'true' : 'false');
									url.searchParams.set('enableAudio', settings?.enableAudio ? 'true' : 'false');
									url.searchParams.set('videoCodec', userSelections.videoCodec);
									url.searchParams.set('videoPreset', userSelections.videoPreset);
									url.searchParams.set('audioPreset', userSelections.audioPreset);
									url.searchParams.set(
										'noiseCancellation',
										userSelections.noiseCancellation ? 'true' : 'false'
									);
									window.location.href = url.toString();
								}
							}
						};
					}}
				>
					<Label class="flex flex-col gap-2">
						Session
						<Select items={selections} bind:value={selected} id="sessionId" name="sessionId" />
					</Label>
					<FormField
						id="identity"
						label="Identity"
						placeholder="Participant identity"
						helper="The name others see for your tracks."
						bind:value={identity}
					/>
					{#if sessionSharingErrors}
						<Alert color="red">
							{#snippet icon()}<ExclamationCircleOutline class="h-5 w-5" />{/snippet}
							{sessionSharingErrors}
						</Alert>
					{/if}
					{#if canShareSession}
						<Button type="submit" color="primary" class="w-full">Share</Button>
					{/if}
				</form>
			{:else}
				<P class="text-sm text-gray-500 dark:text-gray-400">
					No active sessions to share to. Please wait for the session to start.
				</P>
			{/if}
		</Card>
	{/if}
</div>
