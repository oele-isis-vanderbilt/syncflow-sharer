<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { LocalTrack, Room, Track, VideoPresets } from 'livekit-client';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();
	let devices = $state<MediaDeviceInfo[]>([]);
	let room = $state<Room | null>(null);
	let publicationsReady = $state(false);

	onMount(async () => {
		devices = await Room.getLocalDevices();
		await shareDevicesToSession(data.livekit.token, data.livekit.serverUrl);
	});

	function getSelectedDeviceName(deviceId: string) {
		const device = devices.find((d) => d.deviceId === deviceId);
		return device?.label || 'Unknown Device';
	}

	async function shareDevicesToSession(token: string, livekitServerUrl: string) {
		room = new Room({
			adaptiveStream: true,
			dynacast: true,

			videoCaptureDefaults: {
				resolution: VideoPresets.h1080
			},
			publishDefaults: {
				videoCodec: 'vp9'
			},
			stopLocalTrackOnUnpublish: true
		});
		await room.connect(livekitServerUrl, token);

		if (data.sharingDetails.audioDeviceId) {
			await room.localParticipant.setMicrophoneEnabled(true, {
				deviceId: data.sharingDetails.audioDeviceId
			});
		}

		if (data.sharingDetails.videoDeviceId) {
			await room.localParticipant.setCameraEnabled(
				true,
				{
					deviceId: data.sharingDetails.videoDeviceId,
					resolution: VideoPresets.h1080
				},
				{
					videoCodec: 'vp9',
					name: `${data.sharingDetails.identity}'s-camera`,
					simulcast: true
				}
			);
		}

		if (data.sharingDetails.screenShareEnabled === 'true') {
			await room.localParticipant.setScreenShareEnabled(true, {
				contentHint: 'detail',
				audio: false
			});
		}

		publicationsReady = true;

		room.on('disconnected', async () => {
			window.location.href = '/';
		});
	}

	async function stopPublishing() {
		if (room) {
			const publications = room.localParticipant.getTrackPublications();
			for (const publication of publications) {
				if (publication.track) {
					await room.localParticipant.unpublishTrack(publication.track as LocalTrack);
				}
			}
			await room.disconnect();
			room = null;
		}
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	function attachVideoSource(source: Track.Source, node: HTMLVideoElement) {
		$effect(() => {
			if (node && room) {
				const publication = room.localParticipant
					.getTrackPublications()
					.find((t) => t.track?.kind === Track.Kind.Video && t.track?.source === source);

				if (publication) {
					publication.track?.attach(node);
				}
				return () => {
					if (publication) {
						publication.track?.detach(node);
					}
				};
			}
		});
	}

	function attachAudioSource(node: HTMLAudioElement) {
		$effect(() => {
			if (node && room) {
				const publication = room.localParticipant
					.getTrackPublications()
					.find((t) => t.track?.kind === Track.Kind.Audio);

				if (publication) {
					publication.track?.attach(node);
					node.muted = true;
				}
				return () => {
					if (publication) {
						publication.track?.detach(node);
					}
				};
			}
		});
	}

	const attachLocalVideo = attachVideoSource.bind(null, Track.Source.Camera);
	const attachLocalScreen = attachVideoSource.bind(null, Track.Source.ScreenShare);
	const attachLocalAudio = attachAudioSource;
</script>

<div class="max-w-8xl mx-auto flex flex-col px-2 py-2">
	<div class="text-center">
		<h2 class="text-lg font-bold italic text-black dark:text-gray-300">
			You are sharing to session {data.sharingDetails.sessionName} as {data.sharingDetails.identity}
		</h2>
		{#if data.sharingDetails.audioDeviceId}
			<p class="text-black dark:text-gray-300">
				Audio Device: {getSelectedDeviceName(data.sharingDetails.audioDeviceId)}
			</p>
		{/if}
		{#if data.sharingDetails.videoDeviceId}
			<p class="text-black dark:text-gray-300">
				Video Device: {getSelectedDeviceName(data.sharingDetails.videoDeviceId)}
			</p>
		{/if}
		{#if data.sharingDetails.screenShareEnabled === 'true'}
			<p class="text-black dark:text-gray-300">Screen Share: Enabled</p>
		{/if}
		<Button
			class="mt-4 w-full rounded bg-red-700 px-4 py-2 font-bold text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-700"
			on:click={stopPublishing}>Stop Sharing</Button
		>
		{#if publicationsReady}
			<div class="mt-2 flex flex-col gap-2 md:flex-row">
				<div class="w-full items-center md:w-1/3">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-300">Audio</h2>
					<div class="flex h-32 flex-col items-center justify-center dark:bg-gray-700">
						<audio use:attachLocalAudio class="w-full" controls></audio>
					</div>
				</div>
				<div class="w-full md:w-1/3">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-300">Video</h2>
					<!-- svelte-ignore a11y_media_has_caption -->
					<video use:attachLocalVideo class="h-32 w-full"></video>
				</div>
				<div class="w-full md:w-1/3">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-300">Screen Share</h2>
					<!-- svelte-ignore a11y_media_has_caption -->
					<video use:attachLocalScreen class="h-32 w-full"></video>
				</div>
			</div>
		{/if}
	</div>
</div>
