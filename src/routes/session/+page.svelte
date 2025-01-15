<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import {
		createLocalAudioTrack,
		createLocalVideoTrack,
		LocalTrack,
		Room,
		Track,
		type TrackPublishDefaults
	} from 'livekit-client';
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

		let publicationRequestBody = {
			sessionId: data.sharingDetails.sessionId,
			sessionName: data.sharingDetails.sessionName,
			identity: data.sharingDetails.identity,
			screenShare: {
				publicationSid: '',
				trackInfo: {}
			},
			audioTracks: [],
			videoTracks: []
		};

		if (data.sharingDetails.screenShareEnabled) {
			const publication = await room.localParticipant.setScreenShareEnabled(
				true,
				{
					contentHint: 'detail',
					audio: false,
					resolution: getVideoPreset(data.sharingDetails.videoPreset || 'h1080').resolution,
					video: { displaySurface: 'monitor' }
				},
				{
					videoCodec: data.sharingDetails.videoCodec || 'h264',
					name: `${data.sharingDetails.identity}'s-screen`,
					simulcast: true
				}
			);
			publicationRequestBody.screenShare.publicationSid =
				publication?.trackSid || publication?.trackInfo?.sid || '';
			publicationRequestBody.screenShare.trackInfo = publication?.trackInfo?.toJson() || {};
		}

		if (data.sharingDetails.enableAudio && data.sharingDetails.audioDeviceIds.length > 0) {
			let pubDetails = await Promise.all(
				data.sharingDetails.audioDeviceIds.map((audioDeviceId) => {
					if (room) {
						return publishAudioTrack(room, audioDeviceId);
					}
				})
			);

			publicationRequestBody.audioTracks = pubDetails;
		}

		if (data.sharingDetails.enableCamera && data.sharingDetails.videoDeviceIds.length > 0) {
			let pubDetails = await Promise.all(
				data.sharingDetails.videoDeviceIds.map((videoDeviceId) => {
					if (room) {
						return publishVideoTrack(room, videoDeviceId);
					}
				})
			);

			publicationRequestBody.videoTracks = pubDetails;
		}

		publicationsReady = true;

		await fetch('/api/publication_record', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(publicationRequestBody)
		});

		room.on('disconnected', async () => {
			window.location.href = '/';
		});
	}

	async function publishAudioTrack(room: Room, audioDeviceId: string) {
		const localAudioTrack = await createLocalAudioTrack({
			deviceId: audioDeviceId,
			sampleRate: getAudioPreset(data.sharingDetails.audioPreset || 'musicHighQuality').maxBitrate,
			channelCount: 1
		});

		const publication = await room.localParticipant.publishTrack(localAudioTrack, {
			audioPreset: getAudioPreset(data.sharingDetails.audioPreset || 'musicHighQuality'),
			dtx: false,
			red: false,
			source: Track.Source.Microphone,
			name: `${getSelectedDeviceName(audioDeviceId)}-microphone`
		});

		return {
			publicationSid: publication.trackSid || publication.trackInfo?.sid || '',
			deviceId: audioDeviceId,
			deviceName: getSelectedDeviceName(audioDeviceId),
			kind: 'audio',
			trackInfo: publication.trackInfo?.toJson()
		};
	}

	async function publishVideoTrack(room: Room, videoDeviceId: string) {
		const localVideoTrack = await createLocalVideoTrack({
			deviceId: videoDeviceId,
			resolution: getVideoPreset(data.sharingDetails.videoPreset || 'h1080').resolution
		});

		localVideoTrack.sid = `${getSelectedDeviceName(videoDeviceId)}-${videoDeviceId.slice(0, 5)}-${localVideoTrack.sid}`;

		const publication = await room.localParticipant.publishTrack(localVideoTrack, {
			videoCodec: data.sharingDetails.videoCodec || 'h264',
			name: `${getSelectedDeviceName(videoDeviceId)}-camera`,
			simulcast: true,
			source: Track.Source.Camera
		});

		return {
			publicationSid: publication.trackSid || publication.trackInfo?.sid || '',
			deviceId: videoDeviceId,
			deviceName: getSelectedDeviceName(videoDeviceId),
			kind: 'video',
			trackInfo: publication.trackInfo?.toJson()
		};
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

	function attachVideoSources(source: Track.Source, node: HTMLDivElement) {
		$effect(() => {
			if (node && room) {
				const publications = room.localParticipant
					.getTrackPublications()
					.filter((t) => t.track?.kind === Track.Kind.Video && t.track?.source === source);

				const trackInfoDiv = document.createElement('div');
				trackInfoDiv.className = 'flex flex-col gap-2';
				node.appendChild(trackInfoDiv);

				publications.map((publication) => {
					if (publication.track) {
						const video = publication.track.attach();
						video.id = publication.track.sid || '';
						video.className = 'h-32 w-full';
						const span = document.createElement('span');
						span.className = 'text-black dark:text-gray-300';
						span.textContent = publication.trackName || '';
						trackInfoDiv.appendChild(video);
						trackInfoDiv.appendChild(span);
					}
				});

				return () => {
					publications.map((publication) => {
						if (publication.track) {
							const video = document.getElementById(
								publication.track?.sid || ''
							) as HTMLMediaElement;
							if (video) {
								publication.track.detach(video);
								video.remove();
							}

							if (trackInfoDiv) {
								trackInfoDiv.remove();
							}
						}
					});
				};
			}
		});
	}

	function attachAudioSource(node: HTMLDivElement) {
		$effect(() => {
			if (node && room) {
				const publications = room.localParticipant
					.getTrackPublications()
					.filter((t) => t.track?.kind === Track.Kind.Audio);

				const trackInfoDiv = document.createElement('div');
				trackInfoDiv.className = 'flex flex-col gap-2';
				node.appendChild(trackInfoDiv);

				publications.map((publication) => {
					if (publication.track) {
						const audio = publication.track.attach();
						audio.id = publication.track.sid || '';
						// audio.className = 'h-32 w-full';
						audio.controls = true;
						audio.autoplay = false;
						audio.muted = true;
						const span = document.createElement('span');
						span.className = 'text-black dark:text-gray-300';
						span.textContent = publication.trackName || '';
						trackInfoDiv.appendChild(audio);
						trackInfoDiv.appendChild(span);
					}
				});

				return () => {
					publications.map((publication) => {
						if (publication.track) {
							const audio = document.getElementById(
								publication.track?.sid || ''
							) as HTMLMediaElement;
							if (audio) {
								publication.track.detach(audio);
								audio.remove();
							}

							if (trackInfoDiv) {
								trackInfoDiv.remove();
							}
						}
					});
				};
			}
		});
	}

	const attachLocalVideos = attachVideoSources.bind(null, Track.Source.Camera);
	const attachLocalScreen = attachVideoSources.bind(null, Track.Source.ScreenShare);
	const attachLocalAudios = attachAudioSource;
</script>

<div class="max-w-8xl mx-auto flex flex-col px-2 py-2">
	<div class="text-center">
		<h2 class="text-lg font-bold italic text-black dark:text-gray-300">
			You are sharing to session {data.sharingDetails.sessionName} as {data.sharingDetails.identity}
		</h2>
		{#if data.sharingDetails.audioDeviceIds.length > 0}
			<p class="text-black dark:text-gray-300">
				Audio Devices: {data.sharingDetails.audioDeviceIds.map(getSelectedDeviceName).join(',')} (Enabled:
				{data.sharingDetails.enableAudio})
			</p>
		{/if}
		{#if data.sharingDetails.videoDeviceIds.length > 0}
			<p class="text-black dark:text-gray-300">
				Video Devices: {data.sharingDetails.videoDeviceIds.map(getSelectedDeviceName).join(',')} (Enabled:
				{data.sharingDetails.enableCamera})
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
					<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-300">Audio Tracks</h2>
					{#if data.sharingDetails.enableAudio}
						<!-- <audio use:attachLocalAudio class="w-full" controls></audio> -->
						<div
							use:attachLocalAudios
							class="flex flex-col items-center justify-center gap-2 dark:bg-gray-700"
						></div>
					{:else}
						<p class="text-black dark:text-gray-300">Audio Disabled</p>
					{/if}
				</div>
				<div class="w-full md:w-1/3">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-300">Video Tracks</h2>
					{#if data.sharingDetails.enableCamera}
						<div
							use:attachLocalVideos
							class="flex flex-col items-center justify-center gap-2 dark:bg-gray-700"
						></div>
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
						<div
							use:attachLocalScreen
							class="flex flex-col items-center justify-center dark:bg-gray-700"
						></div>
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
