<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { LocalTrack, Room, Track, type TrackPublishDefaults } from 'livekit-client';
	import { AudioPresets, VideoPresets } from 'livekit-client';

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
				resolution: getVideoPreset(data.sharingDetails.videoPreset || 'h1080')
			},
			audioCaptureDefaults: {
				sampleRate: getAudioPreset(data.sharingDetails.audioPreset || 'musicHighQuality').maxBitrate
			},
			publishDefaults: {
				videoCodec: data.sharingDetails.videoCodec || 'h264',
				audioPreset: getAudioPreset(data.sharingDetails.audioPreset || 'musicHighQuality')
			} satisfies TrackPublishDefaults,
			stopLocalTrackOnUnpublish: true
		});
		await room.connect(livekitServerUrl, token);

		if (data.sharingDetails.screenShareEnabled) {
			await room.localParticipant.setScreenShareEnabled(
				true,
				{
					contentHint: 'detail',
					audio: false,
					resolution: getVideoPreset(data.sharingDetails.videoPreset || 'h1080'),
					video: { displaySurface: 'monitor' }
				},
				{
					videoCodec: data.sharingDetails.videoCodec || 'h264',
					name: `${data.sharingDetails.identity}'s-screen`,
					simulcast: true
				}
			);
		}

		if (data.sharingDetails.enableAudio && data.sharingDetails.audioDeviceId) {
			await room.localParticipant.setMicrophoneEnabled(
				true,
				{
					deviceId: data.sharingDetails.audioDeviceId,
					sampleRate: getAudioPreset(data.sharingDetails.audioPreset || 'musicHighQuality')
						.maxBitrate,
					channelCount: 1
				},
				{
					audioPreset: getAudioPreset(data.sharingDetails.audioPreset || 'musicHighQuality'),
					dtx: false,
					red: false
				}
			);
		}

		if (data.sharingDetails.enableCamera && data.sharingDetails.videoDeviceId) {
			await room.localParticipant.setCameraEnabled(
				true,
				{
					deviceId: data.sharingDetails.videoDeviceId,
					resolution: getVideoPreset(data.sharingDetails.videoPreset || 'h1080')
				},
				{
					videoCodec: data.sharingDetails.videoCodec || 'h264',
					name: `${data.sharingDetails.identity}'s-camera`,
					simulcast: true
				}
			);
		}

		publicationsReady = true;

		room.on('disconnected', async () => {
			window.location.href = '/';
		});
	}

	function getAudioPreset(preset: string) {
		switch (preset) {
			case 'telephone':
				return AudioPresets.telephone;
			case 'speech':
				return AudioPresets.speech;
			case 'music':
				return AudioPresets.music;
			case 'musicStereo':
				return AudioPresets.musicStereo;
			case 'musicHighQuality':
				return AudioPresets.musicHighQuality;
			case 'musicHighQualityStereo':
				return AudioPresets.musicHighQualityStereo;
			default:
				return AudioPresets.musicHighQuality;
		}
	}

	function getVideoPreset(preset: string) {
		switch (preset) {
			case 'h2160':
				return VideoPresets.h2160;
			case 'h1080':
				return VideoPresets.h1080;
			case 'h720':
				return VideoPresets.h720;
			case 'h540':
				return VideoPresets.h540;
			case 'h360':
				return VideoPresets.h360;
			default:
				return VideoPresets.h1080;
		}
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
				Audio Device: {getSelectedDeviceName(data.sharingDetails.audioDeviceId)} (Enabled: {data
					.sharingDetails.enableAudio})
			</p>
		{/if}
		{#if data.sharingDetails.videoDeviceId}
			<p class="text-black dark:text-gray-300">
				Video Device: {getSelectedDeviceName(data.sharingDetails.videoDeviceId)} (Enabled: {data
					.sharingDetails.enableCamera})
			</p>
		{/if}

		<p class="text-black dark:text-gray-300">
			Screen Share: {data.sharingDetails.screenShareEnabled ? 'Enabled' : 'Disabled'}
		</p>
		<Button
			class="mt-4 w-full rounded bg-red-700 px-4 py-2 font-bold text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-700"
			on:click={stopPublishing}>Stop Sharing</Button
		>
		{#if publicationsReady}
			<div class="mt-2 flex flex-col gap-2 md:flex-row">
				<div class="w-full items-center md:w-1/3">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-300">Audio</h2>
					<div class="flex h-32 flex-col items-center justify-center dark:bg-gray-700">
						{#if data.sharingDetails.enableAudio}
							<audio use:attachLocalAudio class="w-full" controls></audio>
						{:else}
							<p class="text-black dark:text-gray-300">Audio Disabled</p>
						{/if}
					</div>
				</div>
				<div class="w-full md:w-1/3">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-300">Video</h2>
					{#if data.sharingDetails.enableCamera}
						<!-- svelte-ignore a11y_media_has_caption -->
						<video use:attachLocalVideo class="h-32 w-full"></video>
					{:else}
						<div class="flex h-32 flex-col items-center justify-center dark:bg-gray-700">
							<p class="text-black dark:text-gray-300">Video Disabled</p>
						</div>
					{/if}
				</div>
				<div class="w-full md:w-1/3">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-300">Screen Share</h2>
					{#if data.sharingDetails.screenShareEnabled}
						<!-- svelte-ignore a11y_media_has_caption -->
						<video use:attachLocalScreen class="h-32 w-full"></video>
					{:else}
						<div class="flex h-32 flex-col items-center justify-center dark:bg-gray-700">
							<p class="text-black dark:text-gray-300">Screen Share Disabled</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
