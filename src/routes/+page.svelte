<script lang="ts">
	import type { PageData } from './$types';
	import { Button, Input, Label, P, Select } from 'flowbite-svelte';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { Room } from 'livekit-client';
	import DeviceSelector from '$lib/components/device-selector.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import CodecSelector from '$lib/components/codec-selector.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const activeSessions =
		data.sessions?.filter(
			(session) =>
				session.status === 'Started' && session.comments === 'Created from SyncFlow Sharer'
		) || [];
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
		audioPreset: ''
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

<div class="max-w-8xl mx-auto flex flex-col px-2 py-2">
	{#if data.error}
		<h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-300">
			Error Fetching Sessions From SyncFlow
		</h2>
		<pre
			class="mt-2 w-full overflow-auto bg-gray-300 p-2 text-black dark:bg-gray-800 dark:text-gray-300">{JSON.stringify(
				data.error,
				null,
				2
			)}</pre>
	{:else}
		<div class="w-full">
			<DeviceSelector
				bind:audioDeviceIds={userSelections.audioDeviceIds}
				bind:videoDeviceIds={userSelections.videoDeviceIds}
			/>
		</div>
		<div class="w-full">
			<CodecSelector
				bind:selectedVideoCodec={userSelections.videoCodec}
				bind:selectedAudioPreset={userSelections.audioPreset}
				bind:selectedVideoPreset={userSelections.videoPreset}
			/>
		</div>
		<h2 class="mt-5 text-lg font-semibold text-gray-900 dark:text-gray-300">
			Select Session to Share
		</h2>

		{#if selections.length !== 0}
			<form
				class="mt-2 w-full p-2"
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
								window.location.href = url.toString();
							}
						}
					};
				}}
			>
				<Label>
					Select a Session
					<Select
						class="mt-2"
						items={selections}
						bind:value={selected}
						id="sessionId"
						name="sessionId"
					/>
				</Label>
				<div class="mb-3 mt-2">
					<Label for="identity" class="mb-2 block">Enter Identity</Label>
					<Input
						type="text"
						id="identity"
						name="identity"
						bind:value={identity}
						size="md"
						placeholder="Participant Identity"
					/>
				</div>
				{#if sessionSharingErrors}
					<span class="text-sm text-red-500">{sessionSharingErrors}</span>
				{/if}

				{#if canShareSession}
					<Button
						type="submit"
						class="mt-4 w-full rounded bg-blue-700 px-4 py-2 font-bold text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-700"
						>Share</Button
					>
				{/if}
			</form>
		{/if}
		{#if selections.length === 0}
			<div class="p-2 text-xs text-gray-900 dark:text-gray-300">
				No active sessions to share to. Please wait for the session to start.
			</div>
		{/if}
	{/if}
	{#if form?.success}
		<div>{JSON.stringify(form?.data)}</div>
	{/if}
</div>
