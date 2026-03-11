<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import * as livekit from 'livekit-client';
	import type { TrackSubscription } from '$lib/components/video';
	import MdFullscreen from 'svelte-icons/md/MdFullscreen.svelte';
	import Grid from '$lib/components/video/fullscreen-grid.svelte';
	import { goto } from '$app/navigation';
	import { Tooltip, Button } from 'flowbite-svelte';
	import Fullscreen from '$lib/components/video/fullscreen.svelte';
	import VideoTrack from '$lib/components/video/video-track.svelte';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	const subscribedAudioTracks = $state<Record<string, TrackSubscription>>({});
	const subscrbedVideoTracks = $state<Record<string, TrackSubscription>>({});
	let room = $state<livekit.Room | null>(null);

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

	function attachAudio(node: HTMLAudioElement) {
		$effect(() => {
			if (node) {
				const track = subscribedAudioTracks[node.id];
				if (track) {
					track.track.attach(node);
					node.muted = true;
				}
				return () => {
					if (track) {
						track.track.detach(node);
					}
				};
			}
		});
	}

	function appendDataMessages(node: HTMLDivElement) {
		$effect(() => {
			if (node) {
				const encoder = new TextDecoder();
				room?.on('dataReceived', (payload: Uint8Array, participant, kind, topic) => {
					const span = document.createElement('span');

					let stringContent = encoder.decode(payload);

					const timestamp = new Date().toLocaleString();

					span.className = 'block font-mono text-sm p-1 border-b break-words max-w-full';
					span.textContent = `[${timestamp}] ${participant?.identity}: ${stringContent}`;

					node.appendChild(span);
					node.scroll({ top: node.scrollHeight, behavior: 'smooth' });
				});
			}
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
</script>

<div
	class="max-w-8xl mx-auto mb-60 flex h-full flex-col gap-2 overflow-auto overflow-y-auto px-6 pb-0 pt-4 lg:px-6 lg:pt-4"
>
	<div class="flex flex-row justify-between">
		<div>
			<h2 class="font-semibold text-gray-900 md:text-2xl dark:text-gray-300">
				Welcome to Session {data.session.name}!, {data.token.identity}
			</h2>
			{#if true}
				{@const stats = getSessionStats()}
				<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
					{stats.participantCount} participants • {stats.videoTrackCount} video tracks • {stats.audioTrackCount}
					audio tracks
				</p>
			{/if}
		</div>
		<div class="flex flex-row items-center gap-2">
			<form method="POST" action="?/endSession" use:enhance>
				<input type="hidden" name="sessionId" value={data.session.id} />
				<Button type="submit" class="rounded-lg bg-red-700 px-4 py-2 text-white hover:bg-red-800"
					>Stop Session</Button
				>
			</form>
			<Grid {videos} />
		</div>
	</div>

	<!-- View Switcher -->
	<div class="mb-6 mt-4 flex flex-row items-center gap-4">
		<span class="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
		<div class="flex rounded-lg bg-gray-200 p-1 dark:bg-gray-700">
			<button
				class="rounded-md px-3 py-1 text-sm transition-colors {viewMode === 'participants'
					? 'bg-blue-600 text-white'
					: 'text-gray-700 hover:bg-gray-300 dark:text-gray-300 dark:hover:bg-gray-600'}"
				onclick={() => (viewMode = 'participants')}
			>
				By Participant
			</button>
			<button
				class="rounded-md px-3 py-1 text-sm transition-colors {viewMode === 'all'
					? 'bg-blue-600 text-white'
					: 'text-gray-700 hover:bg-gray-300 dark:text-gray-300 dark:hover:bg-gray-600'}"
				onclick={() => (viewMode = 'all')}
			>
				All Tracks
			</button>
		</div>
	</div>

	{#if viewMode === 'participants'}
		<!-- Two-column layout: Participants sidebar + Main content -->
		<div class="flex flex-row gap-4" style="height: 70vh;">
			<!-- Left sidebar: Participants list -->
			<div class="flex w-1/4 min-w-64 flex-col rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
				<h3 class="mb-4 font-semibold text-gray-900 md:text-lg dark:text-gray-300">Participants</h3>
				<div class="flex-1 space-y-2 overflow-y-auto">
					{#each getParticipantGroups() as participant}
						<button
							class="w-full rounded-lg p-3 text-left transition-colors {selectedParticipant ===
							participant.participantId
								? 'bg-blue-200 dark:bg-blue-900'
								: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'}"
							onclick={() => (selectedParticipant = participant.participantId)}
						>
							<div class="truncate font-medium text-gray-900 dark:text-gray-300">
								{participant.participantId}
							</div>
							<div class="text-sm text-gray-500 dark:text-gray-400">
								{participant.videos.length} video, {participant.audios.length} audio
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Main content: Selected participant's tracks -->
			<div class="flex-1 overflow-y-auto">
				{#if selectedParticipant}
					{@const participant = getParticipantGroups().find(
						(p) => p.participantId === selectedParticipant
					)}
					{#if participant}
						<h3 class="mb-4 font-semibold text-gray-900 md:text-xl dark:text-gray-300">
							{participant.participantId} - Media Streams
						</h3>

						<!-- Video tracks for selected participant -->
						{#if participant.videos.length > 0}
							<h4 class="mb-2 font-semibold text-gray-900 md:text-lg dark:text-gray-300">
								Video Streams
							</h4>
							<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								{#each participant.videos as trackInfo}
									<div
										class="flex flex-col justify-between rounded-lg bg-gray-200 dark:bg-gray-700"
										style="height:300px;"
									>
										<div class="flex-1 p-2">
											<VideoTrack subscription={trackInfo} />
										</div>
										<div class="flex flex-row items-center justify-between p-2 text-center">
											<div class="flex w-full flex-col items-center">
												<span class="max-w-48 truncate text-sm text-gray-900 dark:text-gray-300"
													>{trackInfo.name}</span
												>
												<Tooltip>
													{trackInfo.name}
												</Tooltip>
											</div>
											<div class="h-5 w-5 text-gray-900 dark:text-gray-300">
												<Fullscreen>
													{#snippet header(isFull, requestFs)}
														{#if !isFull}
															<button onclick={() => requestFs()}>
																<MdFullscreen role="button" class="p-2 text-xs" />
																<Tooltip class="dark:bg-gray-900" placement="bottom-end"
																	>Full Screen View</Tooltip
																>
															</button>
														{/if}
													{/snippet}
													{#snippet content()}
														<VideoTrack subscription={trackInfo} />
													{/snippet}
												</Fullscreen>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Audio tracks for selected participant -->
						{#if participant.audios.length > 0}
							<h4 class="mb-2 font-semibold text-gray-900 md:text-lg dark:text-gray-300">
								Audio Streams
							</h4>
							<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
								{#each participant.audios as trackInfo}
									<div
										class="flex flex-col justify-between rounded-lg bg-gray-200 dark:bg-gray-700"
										style="height:150px;"
									>
										<div class="flex-1 p-2">
											<audio
												use:attachAudio
												class="h-full w-full dark:bg-gray-700"
												controls
												id={trackInfo.id}
											></audio>
										</div>
										<div class="flex flex-row items-center justify-center p-2 text-center">
											<span class="text-gray-900 dark:text-gray-300">{trackInfo.name}</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					{/if}
				{:else}
					<div class="flex h-64 items-center justify-center">
						<div class="text-center text-gray-500 dark:text-gray-400">
							<p class="mb-2 text-lg">Select a participant from the list</p>
							<p>to view their video and audio streams</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<!-- All tracks view (original layout) -->
		<div style="height: 70vh;" class="overflow-y-auto">
			<h3 class="mb-4 font-semibold text-gray-900 md:text-xl dark:text-gray-300">Video Streams</h3>
			<div class="grid min-h-0 grid-cols-1 justify-start gap-2 p-2 md:grid-cols-3 lg:grid-cols-4">
				{#each Object.entries(subscrbedVideoTracks) as [id, trackInfo]}
					<div
						class="flex flex-col justify-between rounded-lg bg-gray-200 dark:bg-gray-700"
						style="height:300px;"
					>
						<div class="flex-1 p-2">
							<VideoTrack subscription={trackInfo} />
						</div>
						<div class="flex flex-row items-center justify-between p-2 text-center">
							<div class="flex w-full flex-col items-center">
								<span class="max-w-48 truncate text-sm text-gray-900 dark:text-gray-300"
									>{trackInfo.name}</span
								>
								<Tooltip>
									{trackInfo.name}
								</Tooltip>
							</div>
							<div class="h-5 w-5 text-gray-900 dark:text-gray-300">
								<Fullscreen>
									{#snippet header(isFull, requestFs)}
										{#if !isFull}
											<button onclick={() => requestFs()}>
												<MdFullscreen role="button" class="p-2 text-xs" />
												<Tooltip class="dark:bg-gray-900" placement="bottom-end"
													>Full Screen View</Tooltip
												>
											</button>
										{/if}
									{/snippet}
									{#snippet content()}
										<VideoTrack subscription={trackInfo} />
									{/snippet}
								</Fullscreen>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<h3 class="mb-4 mt-6 font-semibold text-gray-900 md:text-xl dark:text-gray-300">
				Audio Streams
			</h3>
			<div class="grid min-h-0 grid-cols-1 justify-start gap-2 md:grid-cols-3 lg:grid-cols-4">
				{#each Object.entries(subscribedAudioTracks) as [id, trackInfo]}
					<div
						class="flex flex-col justify-between rounded-lg bg-gray-200 dark:bg-gray-700"
						style="height:150px;"
					>
						<div class="flex-1 p-2">
							<audio
								use:attachAudio
								class="h-full w-full dark:bg-gray-700"
								controls
								id={trackInfo.id}
							></audio>
						</div>
						<div class="flex flex-row items-center justify-between p-2 text-center">
							<div class="flex w-full flex-col items-center">
								<span class="max-w-48 truncate text-gray-900 dark:text-gray-300">
									{trackInfo.participant}
								</span>
								<Tooltip>
									{trackInfo.participant}
								</Tooltip>
								<span class="text-gray-900 dark:text-gray-300">{trackInfo.name}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<h3 class="mt-6 font-semibold text-gray-900 md:text-xl dark:text-gray-300">Text Streams</h3>
	<div
		class="flex h-96 flex-col overflow-auto rounded-lg bg-gray-950 text-white"
		use:appendDataMessages
	></div>
	<div class="mb-10"></div>
</div>
