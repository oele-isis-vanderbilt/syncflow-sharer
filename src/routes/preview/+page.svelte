<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';
	import * as livekit from 'livekit-client';
	import type { TrackSubscription } from '$lib/components/video';
	import Grid from '$lib/components/video/fullscreen-grid.svelte';
	import { goto } from '$app/navigation';
	import {
		Button,
		ButtonGroup,
		Card,
		Heading,
		Listgroup,
		ListgroupItem,
		P,
		Spinner
	} from 'flowbite-svelte';
	import ConfirmButton from '$lib/components/ui/ConfirmButton.svelte';
	import AudioTile from '$lib/features/preview/AudioTile.svelte';
	import VideoTile from '$lib/features/preview/VideoTile.svelte';

	let { data }: { data: PageData } = $props();

	const subscribedAudioTracks = $state<Record<string, TrackSubscription>>({});
	const subscrbedVideoTracks = $state<Record<string, TrackSubscription>>({});
	let room = $state<livekit.Room | null>(null);

	interface DataMessage {
		at: string;
		from: string;
		text: string;
	}
	let dataMessages = $state<DataMessage[]>([]);
	const decoder = new TextDecoder();

	function handleTrackUnsubscribed(
		track: livekit.RemoteTrack,
		publication: livekit.RemoteTrackPublication,
		participant: livekit.RemoteParticipant
	) {
		if (track.kind === livekit.Track.Kind.Video) {
			if (track.sid && subscrbedVideoTracks[track.sid]) {
				delete subscrbedVideoTracks[track.sid];
			}
		} else if (track.kind === livekit.Track.Kind.Audio) {
			if (track.sid && subscribedAudioTracks[track.sid]) {
				delete subscribedAudioTracks[track.sid];
			}
		}
	}

	function handleTrackSubscribed(
		track: livekit.RemoteTrack,
		publication: livekit.RemoteTrackPublication,
		participant: livekit.RemoteParticipant
	) {
		if (track.kind === livekit.Track.Kind.Video) {
			if (track.sid && !subscrbedVideoTracks[track.sid]) {
				const trackInfo = {
					id: track.sid,
					participant:
						(participant.name || participant.identity) + `(${publication.track?.source})`,
					track,
					participantId: participant.identity,
					kind: track.kind,
					name: publication.trackName || publication.trackInfo?.name
				};
				subscrbedVideoTracks[track.sid] = trackInfo;
			}
		} else if (track.kind === livekit.Track.Kind.Audio) {
			if (track.sid && !subscribedAudioTracks[track.sid]) {
				const trackInfo = {
					id: track.sid,
					participant:
						(participant.name || participant.identity) + `(${publication.track?.source})`,
					track,
					kind: track.kind,
					participantId: participant.identity,
					name: publication.trackName || publication.trackInfo?.name
				};
				subscribedAudioTracks[track.sid] = trackInfo;
			}
		}
	}

	function showIntialTracks(room: livekit.Room) {
		room.remoteParticipants.forEach((participant) => {
			participant.videoTrackPublications.forEach((publication) => {
				if (publication.track) {
					handleTrackSubscribed(publication.track!, publication, participant);
				}
			});

			participant.audioTrackPublications.forEach((publication) => {
				if (publication.track) {
					handleTrackSubscribed(publication.track!, publication, participant);
				}
			});
		});
	}

	onMount(async () => {
		room = new livekit.Room({
			adaptiveStream: true,
			dynacast: true,
			videoCaptureDefaults: {
				resolution: livekit.VideoPresets.h1080
			},
			publishDefaults: {
				videoCodec: 'vp9'
			}
		});

		// Set up event listeners BEFORE connecting to avoid race conditions
		// Track subscription events
		room.on('trackSubscribed', handleTrackSubscribed);
		room.on('trackUnsubscribed', handleTrackUnsubscribed);

		// Participant events
		room.on('participantConnected', (participant) => {
			// When a participant connects, check for existing tracks
			participant.videoTrackPublications.forEach((publication) => {
				if (publication.track) {
					handleTrackSubscribed(publication.track, publication, participant);
				}
			});
			participant.audioTrackPublications.forEach((publication) => {
				if (publication.track) {
					handleTrackSubscribed(publication.track, publication, participant);
				}
			});
		});

		room.on('participantDisconnected', (participant) => {
			// Clean up tracks when participant disconnects
			participant.videoTrackPublications.forEach((publication) => {
				if (publication.track) {
					handleTrackUnsubscribed(publication.track, publication, participant);
				}
			});
			participant.audioTrackPublications.forEach((publication) => {
				if (publication.track) {
					handleTrackUnsubscribed(publication.track, publication, participant);
				}
			});
		});

		// Track publication events
		room.on('trackPublished', (publication, participant) => {
			if (publication.track) {
				handleTrackSubscribed(publication.track, publication, participant);
			}
		});

		room.on('trackUnpublished', (publication, participant) => {
			if (publication.track) {
				handleTrackUnsubscribed(publication.track, publication, participant);
			}
		});

		room.on('disconnected', () => {
			goto('/admin', {
				invalidateAll: true
			});
		});

		room.on('dataReceived', (payload, participant) => {
			dataMessages.push({
				at: new Date().toLocaleString(),
				from: participant?.identity ?? 'unknown',
				text: decoder.decode(payload)
			});
		});

		// Now connect and handle initial tracks
		room.prepareConnection(data.token.livekitServerUrl!, data.token.token);
		await room.connect(data.token.livekitServerUrl!, data.token.token);

		// Process initial tracks after connection
		showIntialTracks(room);

		// Also wait a bit and reprocess in case some tracks weren't ready immediately
		setTimeout(() => {
			if (room) {
				showIntialTracks(room);
			}
		}, 1000);
	});

	// Leaving the page: drop listeners first so 'disconnected' doesn't redirect, then leave.
	onDestroy(() => {
		room?.removeAllListeners();
		room?.disconnect();
	});

	/** Keeps the text-stream log scrolled to the newest message. */
	function scrollToEnd(node: HTMLElement) {
		$effect(() => {
			if (dataMessages.length) node.scroll({ top: node.scrollHeight, behavior: 'smooth' });
		});
	}

	let videos = $derived.by(() => {
		let videos = Object.entries(subscrbedVideoTracks).map(([id, trackInfo]) => ({
			id,
			participant: trackInfo.participant,
			participantId: trackInfo.participantId,
			track: trackInfo.track,
			kind: trackInfo.kind,
			name: trackInfo.name
		}));
		return videos;
	});

	// Group tracks by participant
	function getParticipantGroups() {
		const groups = new Map<string, { videos: TrackSubscription[]; audios: TrackSubscription[] }>();

		// Process video tracks
		Object.entries(subscrbedVideoTracks).forEach(([, trackInfo]) => {
			const participantId = trackInfo.participantId;
			if (!groups.has(participantId)) {
				groups.set(participantId, { videos: [], audios: [] });
			}
			groups.get(participantId)!.videos.push(trackInfo);
		});

		// Process audio tracks
		Object.entries(subscribedAudioTracks).forEach(([, trackInfo]) => {
			const participantId = trackInfo.participantId;
			if (!groups.has(participantId)) {
				groups.set(participantId, { videos: [], audios: [] });
			}
			groups.get(participantId)!.audios.push(trackInfo);
		});

		const result = Array.from(groups.entries()).map(([participantId, tracks]) => ({
			participantId,
			...tracks
		}));

		return result;
	}

	// Selected participant for detailed view
	let selectedParticipant = $state<string | null>(null);

	// View mode: 'participants' (default) or 'all'
	let viewMode = $state<'participants' | 'all'>('all');

	// Get session statistics
	function getSessionStats() {
		const participants = getParticipantGroups();
		const totalVideoTracks = Object.keys(subscrbedVideoTracks).length;
		const totalAudioTracks = Object.keys(subscribedAudioTracks).length;

		return {
			participantCount: participants.length,
			videoTrackCount: totalVideoTracks,
			audioTrackCount: totalAudioTracks,
			totalTracks: totalVideoTracks + totalAudioTracks
		};
	}

	const stats = $derived(getSessionStats());
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
		<div class="flex flex-col gap-2">
			<Heading tag="h1" class="text-3xl md:text-4xl">{data.session.name}</Heading>
			<P class="text-sm text-gray-500 dark:text-gray-400">
				Previewing as {data.token.identity} · {stats.participantCount} participants ·
				{stats.videoTrackCount} video tracks · {stats.audioTrackCount} audio tracks
			</P>
		</div>
		<div class="flex flex-row items-center gap-2">
			<Grid {videos} />
			<ConfirmButton
				action="?/endSession"
				fields={{ sessionId: data.session.id }}
				label="Stop Session"
				title="Stop this session?"
				message={`Stopping "${data.session.name}" ends it for everyone sharing into it. This can't be undone.`}
			/>
		</div>
	</div>

	<div class="flex flex-row items-center gap-4">
		<span class="text-sm font-medium text-gray-900 dark:text-white">View</span>
		<ButtonGroup>
			<Button
				size="sm"
				color={viewMode === 'participants' ? 'primary' : 'alternative'}
				aria-pressed={viewMode === 'participants'}
				onclick={() => (viewMode = 'participants')}>By Participant</Button
			>
			<Button
				size="sm"
				color={viewMode === 'all' ? 'primary' : 'alternative'}
				aria-pressed={viewMode === 'all'}
				onclick={() => (viewMode = 'all')}>All Tracks</Button
			>
		</ButtonGroup>
	</div>

	{#if Object.keys(subscrbedVideoTracks).length + Object.keys(subscribedAudioTracks).length === 0}
		<div class="flex items-center gap-3" role="status">
			<Spinner size="6" />
			<P class="text-gray-500 dark:text-gray-400">Waiting for participants to share…</P>
		</div>
	{:else if viewMode === 'participants'}
		<div class="flex flex-col gap-6 md:flex-row">
			<Card size="xl" class="flex flex-col gap-4 p-4 sm:p-6 md:w-1/4 md:min-w-64">
				<Heading tag="h2" class="text-xl">Participants</Heading>
				<Listgroup active class="max-h-96 overflow-y-auto">
					{#each getParticipantGroups() as participant (participant.participantId)}
						<ListgroupItem
							active
							current={selectedParticipant === participant.participantId}
							onclick={() => (selectedParticipant = participant.participantId)}
						>
							<span class="flex min-w-0 flex-col text-start">
								<span class="truncate font-medium">{participant.participantId}</span>
								<span class="text-sm text-gray-500 dark:text-gray-400">
									{participant.videos.length} video, {participant.audios.length} audio
								</span>
							</span>
						</ListgroupItem>
					{/each}
				</Listgroup>
			</Card>

			<div class="flex min-w-0 flex-1 flex-col gap-6">
				{#if selectedParticipant}
					{@const participant = getParticipantGroups().find(
						(p) => p.participantId === selectedParticipant
					)}
					{#if participant}
						<Heading tag="h2" class="text-xl">{participant.participantId}</Heading>
						{#if participant.videos.length > 0}
							<section class="flex flex-col gap-4">
								<Heading tag="h3" class="text-lg">Video streams</Heading>
								<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
									{#each participant.videos as trackInfo (trackInfo.id)}
										<VideoTile subscription={trackInfo} label={trackInfo.name ?? trackInfo.id} />
									{/each}
								</div>
							</section>
						{/if}
						{#if participant.audios.length > 0}
							<section class="flex flex-col gap-4">
								<Heading tag="h3" class="text-lg">Audio streams</Heading>
								<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
									{#each participant.audios as trackInfo (trackInfo.id)}
										<AudioTile subscription={trackInfo} label={trackInfo.name ?? trackInfo.id} />
									{/each}
								</div>
							</section>
						{/if}
					{/if}
				{:else}
					<div class="flex h-64 items-center justify-center text-center">
						<P class="text-gray-500 dark:text-gray-400">
							Select a participant to view their video and audio streams.
						</P>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<section class="flex flex-col gap-4">
			<Heading tag="h2" class="text-xl">Video streams</Heading>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
				{#each Object.values(subscrbedVideoTracks) as trackInfo (trackInfo.id)}
					<VideoTile subscription={trackInfo} label={trackInfo.name ?? trackInfo.id} />
				{/each}
			</div>
		</section>
		<section class="flex flex-col gap-4">
			<Heading tag="h2" class="text-xl">Audio streams</Heading>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
				{#each Object.values(subscribedAudioTracks) as trackInfo (trackInfo.id)}
					<AudioTile
						subscription={trackInfo}
						label={trackInfo.name ?? trackInfo.id}
						sublabel={trackInfo.participant}
					/>
				{/each}
			</div>
		</section>
	{/if}

	<Card size="xl" class="flex flex-col gap-4 p-4 sm:p-6">
		<Heading tag="h2" class="text-xl">Text streams</Heading>
		<div
			class="flex h-96 flex-col overflow-auto rounded-lg bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100"
			role="log"
			aria-live="polite"
			use:scrollToEnd
		>
			{#each dataMessages as message, i (i)}
				<span
					class="block max-w-full border-b border-gray-200 p-1 font-mono text-sm break-words dark:border-gray-700"
					>[{message.at}] {message.from}: {message.text}</span
				>
			{:else}
				<span class="p-2 text-sm text-gray-500 dark:text-gray-400">No messages yet.</span>
			{/each}
		</div>
	</Card>
</div>
