<script lang="ts">
	import type { PageData } from './$types';
	import { Button, Input, Label, P, Select } from 'flowbite-svelte';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import * as livekit from 'livekit-client';
	import { applyAction } from '$app/forms';
	import { goto } from '$app/navigation';
	import DeviceSelector from '$lib/components/device-selector.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const activeSessions = data.sessions.filter(
		(session) => session.status === 'Started' && session.comments === 'Created from SyncFlow Sharer'
	);
	let selections = activeSessions.map((session) => {
		return {
			value: session.id,
			name: session.name
		};
	});
	let selected = $state(selections.length !== 0 ? selections[0].value : '');
	let identity = $state('');
	let sharing = $state(false);
	let selectedDeviceIds = $state({
		audioDeviceId: '',
		videoDeviceId: ''
	});
	const settings = data.settings;
	let sessionSharingErrors = $state('');

	async function shareDevicesToSession(token: string, livekitServerUrl: string) {
		const room = new livekit.Room({
			adaptiveStream: true,
			dynacast: true,

			videoCaptureDefaults: {
				resolution: livekit.VideoPresets.h1080
			},
			publishDefaults: {
				videoCodec: 'vp9'
			}
		});
		room.prepareConnection(token, livekitServerUrl);

		await room.connect(livekitServerUrl, token);
		if (settings?.enableAudio) {
			await room.localParticipant.setMicrophoneEnabled(true, {
				deviceId: selectedDeviceIds.audioDeviceId
			});
		}

		if (settings?.enableCamera) {
			await room.localParticipant.setCameraEnabled(
				true,
				{
					deviceId: selectedDeviceIds.videoDeviceId,
					resolution: livekit.VideoPresets.h1080
				},
				{
					videoCodec: 'vp9',
					name: `${identity}'s-camera`,
					simulcast: true
				}
			);
		}

		if (settings?.enableScreenShare) {
			await room.localParticipant.setScreenShareEnabled(true);
		}

		sharing = true;

		room.on('disconnected', () => {
			goto('/', {
				invalidateAll: true
			});
		});
	}

	onMount(() => {
		if (browser) {
			const userDeviceSelections = window.localStorage.getItem('userDeviceSelections');
			if (userDeviceSelections) {
				selectedDeviceIds = JSON.parse(userDeviceSelections);
			}
		}
	});

	const deviceExists = async (deviceId: string) => {
		if (browser) {
			const devices = await livekit.Room.getLocalDevices();
			return devices.map((d) => d.deviceId).includes(deviceId);
		} else {
			return false;
		}
	};

	$effect(() => {
		if (browser) {
			localStorage.setItem('userDeviceSelections', JSON.stringify(selectedDeviceIds));
		}
	});

	let canShareSession = $derived.by(async () => {
		let missingDevices: string[] = [];
		let canShare = true;
		if (!identity) {
			canShare = false;
		}

		if (settings?.enableCamera && !(await deviceExists(selectedDeviceIds.videoDeviceId))) {
			missingDevices.push(selectedDeviceIds.videoDeviceId);
			canShare = false;
		}

		if (settings?.enableAudio && !(await deviceExists(selectedDeviceIds.audioDeviceId))) {
			missingDevices.push(selectedDeviceIds.audioDeviceId);
			canShare = false;
		}

		if (missingDevices.length != 0) {
			sessionSharingErrors = `Please select audio/video devices before sharing. Devices with ${missingDevices.join(', ')} don't exist`;
		} else {
			sessionSharingErrors = '';
		}

		return canShare;
	});
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
	{:else if sharing}
		<p class="text-black dark:text-gray-300">You are sharing to session {selected} as {identity}</p>
	{:else}
		<div class="w-full">
			<DeviceSelector
				bind:audioDeviceId={selectedDeviceIds.audioDeviceId}
				bind:videoDeviceId={selectedDeviceIds.videoDeviceId}
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
				use:enhance={(params) => {
					return async ({ result }) => {
						if (result.type === 'success') {
							const tokenDetails = result.data.token;
							await shareDevicesToSession(tokenDetails.token, tokenDetails.livekitServerUrl);
							applyAction(result);
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
				{#await canShareSession}
					<div></div>
				{:then canShare}
					{#if canShare}
						<Button
							type="submit"
							class="mt-4 w-full rounded bg-blue-700 px-4 py-2 font-bold text-white">Share</Button
						>
					{/if}
				{/await}
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
