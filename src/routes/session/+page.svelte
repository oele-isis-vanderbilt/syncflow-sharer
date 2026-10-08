<script lang="ts">
	import { Badge, Button, Card, Heading, P, Spinner } from 'flowbite-svelte';
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
	import {
		postPublicationRecord,
		type PublicationRecord,
		type PublishedTrack
	} from '$lib/api/publication-record';

	interface LocalPreview {
		sid: string;
		name: string;
		kind: Track.Kind;
		source: Track.Source;
		track: LocalTrack;
	}

	let { data }: { data: PageData } = $props();
	let devices = $state<MediaDeviceInfo[]>([]);
	let room = $state<Room | null>(null);
	let publicationsReady = $state(false);
	let localPreviews = $state<LocalPreview[]>([]);
	const audioPreviews = $derived(localPreviews.filter((t) => t.kind === Track.Kind.Audio));
	const cameraPreviews = $derived(localPreviews.filter((t) => t.source === Track.Source.Camera));
	const screenPreviews = $derived(
		localPreviews.filter((t) => t.source === Track.Source.ScreenShare)
	);

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
				sampleRate: getAudioPreset(data.sharingDetails.audioPreset || 'musicHighQuality')
					.maxBitrate,
				noiseSuppression: data.sharingDetails.noiseCancellation
			},
			publishDefaults: {
				videoCodec: data.sharingDetails.videoCodec || 'h264',
				audioPreset: getAudioPreset(data.sharingDetails.audioPreset || 'musicHighQuality')
			} satisfies TrackPublishDefaults,
			stopLocalTrackOnUnpublish: true
		});
		await room.connect(livekitServerUrl, token);

		const publicationRequestBody: PublicationRecord = {
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

		const connectedRoom = room;
		if (data.sharingDetails.enableAudio && data.sharingDetails.audioDeviceIds.length > 0) {
			publicationRequestBody.audioTracks = await Promise.all(
				data.sharingDetails.audioDeviceIds.map((id) => publishAudioTrack(connectedRoom, id))
			);
		}

		if (data.sharingDetails.enableCamera && data.sharingDetails.videoDeviceIds.length > 0) {
			publicationRequestBody.videoTracks = await Promise.all(
				data.sharingDetails.videoDeviceIds.map((id) => publishVideoTrack(connectedRoom, id))
			);
		}

		localPreviews = Array.from(connectedRoom.localParticipant.trackPublications.values()).flatMap(
			(publication) => {
				const track = publication.track;
				return track
					? [
							{
								sid: publication.trackSid,
								name: publication.trackName,
								kind: track.kind,
								source: track.source,
								track
							}
						]
					: [];
			}
		);
		publicationsReady = true;

		await postPublicationRecord(publicationRequestBody);

		room.on('disconnected', async () => {
			window.location.href = '/';
		});
	}

	async function publishAudioTrack(room: Room, audioDeviceId: string): Promise<PublishedTrack> {
		const localAudioTrack = await createLocalAudioTrack({
			deviceId: audioDeviceId,
			sampleRate: getAudioPreset(data.sharingDetails.audioPreset || 'musicHighQuality').maxBitrate,
			channelCount: 1,
			noiseSuppression: data.sharingDetails.noiseCancellation
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

	async function publishVideoTrack(room: Room, videoDeviceId: string): Promise<PublishedTrack> {
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
		localPreviews = [];
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

	/** Attaches a local track to a media element for the lifetime of that element. */
	function attachTrack(node: HTMLMediaElement, track: LocalTrack) {
		track.attach(node);
		return {
			destroy() {
				track.detach(node);
			}
		};
	}
</script>

{#snippet status(label: string, on: boolean, detail: string)}
	<div class="flex flex-wrap items-center gap-2">
		<span class="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
		<Badge color={on ? 'green' : 'gray'}>{on ? 'On' : 'Off'}</Badge>
		{#if detail}
			<span class="text-sm text-gray-500 dark:text-gray-400">{detail}</span>
		{/if}
	</div>
{/snippet}

{#snippet videoPreviews(previews: LocalPreview[], noun: string)}
	{#each previews as preview (preview.sid)}
		<figure class="flex flex-col gap-2">
			<!-- Your own live stream: there is no caption track to attach. -->
			<!-- svelte-ignore a11y_media_has_caption -->
			<video
				use:attachTrack={preview.track}
				class="h-32 w-full rounded-lg bg-gray-50 object-contain dark:bg-gray-700"
				muted
				aria-label="Your {preview.name || noun} preview"
			></video>
			<figcaption class="truncate text-sm text-gray-900 dark:text-white">{preview.name}</figcaption>
		</figure>
	{/each}
{/snippet}

{#snippet disabled(text: string)}
	<div class="flex h-32 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700">
		<P class="text-sm text-gray-500 dark:text-gray-400">{text}</P>
	</div>
{/snippet}

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
		<div class="flex flex-col gap-2">
			<Heading tag="h1" class="text-3xl md:text-4xl"
				>Sharing to {data.sharingDetails.sessionName}</Heading
			>
			<P class="text-gray-500 dark:text-gray-400">as {data.sharingDetails.identity}</P>
		</div>
		<Button color="red" onclick={stopPublishing}>Stop Sharing</Button>
	</div>

	<Card size="xl" class="flex flex-col gap-3 p-4 sm:p-6">
		{@render status(
			'Audio',
			data.sharingDetails.enableAudio,
			data.sharingDetails.audioDeviceIds.map(getSelectedDeviceName).join(', ')
		)}
		{#if data.sharingDetails.enableAudio}
			{@render status('Noise cancellation', data.sharingDetails.noiseCancellation, '')}
		{/if}
		{@render status(
			'Camera',
			data.sharingDetails.enableCamera,
			data.sharingDetails.videoDeviceIds.map(getSelectedDeviceName).join(', ')
		)}
		{@render status('Screen share', data.sharingDetails.screenShareEnabled, '')}
	</Card>

	{#if !publicationsReady}
		<div class="flex items-center gap-3" role="status">
			<Spinner size="6" />
			<P class="text-gray-500 dark:text-gray-400">Connecting and publishing your tracks…</P>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
			<Card size="xl" class="flex flex-col gap-4 p-4 sm:p-6">
				<Heading tag="h2" class="text-xl">Audio tracks</Heading>
				{#if data.sharingDetails.enableAudio}
					<div class="flex flex-col gap-4">
						{#each audioPreviews as preview (preview.sid)}
							<figure class="flex flex-col gap-2">
								<audio
									use:attachTrack={preview.track}
									class="w-full"
									controls
									muted
									aria-label="Your {preview.name || 'audio'} track"
								></audio>
								<figcaption class="truncate text-sm text-gray-900 dark:text-white">
									{preview.name}
								</figcaption>
							</figure>
						{/each}
					</div>
				{:else}
					{@render disabled('Audio disabled')}
				{/if}
			</Card>
			<Card size="xl" class="flex flex-col gap-4 p-4 sm:p-6">
				<Heading tag="h2" class="text-xl">Video tracks</Heading>
				{#if data.sharingDetails.enableCamera}
					<div class="flex flex-col gap-4">{@render videoPreviews(cameraPreviews, 'camera')}</div>
				{:else}
					{@render disabled('Video disabled')}
				{/if}
			</Card>
			<Card size="xl" class="flex flex-col gap-4 p-4 sm:p-6">
				<Heading tag="h2" class="text-xl">Screen share</Heading>
				{#if data.sharingDetails.screenShareEnabled}
					<div class="flex flex-col gap-4">{@render videoPreviews(screenPreviews, 'screen')}</div>
				{:else}
					{@render disabled('Screen share disabled')}
				{/if}
			</Card>
		</div>
	{/if}
</div>
