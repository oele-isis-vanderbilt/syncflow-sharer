<script lang="ts" module>
	import type { RemoteTrack, Track } from 'livekit-client';

	export interface TrackSubscription {
		participant: string;
		track: RemoteTrack;
		kind: Track.Kind;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import * as livekit from 'livekit-client';
	import MdFullscreen from 'svelte-icons/md/MdFullscreen.svelte';
	import { goto } from '$app/navigation';
	import FullScreen from 'svelte-fullscreen';
	import { Tooltip } from 'flowbite-svelte';

	let { data }: { data: PageData } = $props();
	let videoContainer: HTMLDivElement;
	let audioContainer: HTMLDivElement;

	const subscribedAudioTracks = $state<Record<string, TrackSubscription>>({});
	const subscrbedVideoTracks = $state<Record<string, TrackSubscription>>({});
	let fullScreen = $state(false);
	let fullScreenText = $state('');
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
				subscrbedVideoTracks[track.sid] = {
					participant:
						(participant.name || participant.identity) + `(${publication.track?.source})`,
					track,
					kind: track.kind
				};
			}
		} else if (track.kind === livekit.Track.Kind.Audio) {
			if (track.sid && !subscribedAudioTracks[track.sid]) {
				subscribedAudioTracks[track.sid] = {
					participant:
						(participant.name || participant.identity) + `(${publication.track?.source})`,
					track,
					kind: track.kind
				};
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
		room.prepareConnection(data.token.livekitServerUrl!, data.token.token);

		await room.connect(data.token.livekitServerUrl!, data.token.token);
		showIntialTracks(room);
		room.on('trackSubscribed', handleTrackSubscribed);
		room.on('trackUnsubscribed', handleTrackUnsubscribed);
		room.on('disconnected', () => {
			goto('/admin', {
				invalidateAll: true
			});
		});
	});

	function attachVideo(node: HTMLVideoElement) {
		$effect(() => {
			if (node) {
				const track = subscrbedVideoTracks[node.id];
				if (track) {
					track.track.attach(node);
				}
				return () => {
					if (track) {
						track.track.detach(node);
					}
				};
			}
		});
	}

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
</script>

<div
	class="max-w-8xl mx-auto mb-60 flex h-full flex-col gap-2 overflow-auto overflow-y-auto px-6 pb-0 pt-4 lg:px-6 lg:pt-4"
>
	<div class="flex flex-row justify-between">
		<h2 class="font-semibold text-gray-900 md:text-2xl dark:text-gray-300">
			Welcome to Session {data.session.name}!, {data.token.identity}
		</h2>
		<div class="flex flex-row items-center justify-between text-center">
			<h3 class="font-semibold text-gray-900 md:text-xl dark:text-gray-300">{fullScreenText}</h3>
			<div class="h-5 w-5">
				<button class="text-gray-900 dark:text-gray-300">
					<MdFullscreen role="button" class="p-2 text-xs text-black dark:text-gray-300" />
				</button>
			</div>
			<Tooltip class="dark:bg-gray-900" placement="bottom-start"
				>Enter Full Screen(grid) View [todo]</Tooltip
			>
		</div>
	</div>

	<h3 class="font-semibold text-gray-900 md:text-xl dark:text-gray-300">Video Streams</h3>
	<div
		class="grid min-h-0 grid-cols-1 justify-start gap-2 p-2 md:grid-cols-3 lg:grid-cols-4"
		bind:this={videoContainer}
	>
		{#each Object.entries(subscrbedVideoTracks) as [id, trackInfo]}
			<div class="flex flex-col justify-between bg-gray-200 dark:bg-gray-700" style="height:300px;">
				<FullScreen let:onRequest let:onExit>
					<div class="flex-1">
						<!-- svelte-ignore a11y_media_has_caption -->
						<video use:attachVideo class="h-full w-full" {id}></video>
					</div>
					<div class="flex flex-row items-center justify-between text-center">
						<span class="p-2 text-gray-900 dark:text-gray-300">{trackInfo.participant}</span>
						<div class="h-5 w-5 text-gray-900 dark:text-gray-300">
							<button
								onclick={() => {
									onRequest();
									fullScreen = true;
									fullScreenText = trackInfo.participant;
								}}
							>
								<MdFullscreen role="button" class="p-2 text-xs" />
							</button>
							<Tooltip class="dark:bg-gray-900" placement="bottom-end">Full Screen View</Tooltip>
						</div>
					</div>
				</FullScreen>
			</div>
		{/each}
	</div>
	<h3 class="font-semibold text-gray-900 md:text-xl dark:text-gray-300">Audio Steams</h3>
	<div
		class="grid min-h-0 grid-cols-1 justify-start gap-2 md:grid-cols-3 lg:grid-cols-4"
		bind:this={audioContainer}
	>
		{#each Object.entries(subscribedAudioTracks) as [id, trackInfo]}
			<div class="flex flex-col justify-between bg-gray-200 dark:bg-gray-700" style="height:100px;">
				<div class="flex-1 p-2">
					<!-- svelte-ignore a11y_media_has_caption -->
					<audio use:attachAudio class="h-full w-full dark:bg-gray-700" controls {id}></audio>
				</div>
				<div class="flex flex-row items-center justify-between text-center dark:bg-gray-700">
					<span class="p-2 text-gray-900 dark:text-gray-300">{trackInfo.participant}</span>
				</div>
			</div>
		{/each}
	</div>
	<h3 class="font-semibold text-gray-900 md:text-xl dark:text-gray-300">Text Streams</h3>
	<div class="flex h-96 flex-col overflow-auto bg-gray-950 text-white" use:appendDataMessages></div>
	<div class="mb-10"></div>
</div>
