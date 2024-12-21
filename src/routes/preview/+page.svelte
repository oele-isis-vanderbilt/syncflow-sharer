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

	const subscribedAudioTracks = $state<Record<string, TrackSubscription>>({});
	const subscrbedVideoTracks = $state<Record<string, TrackSubscription>>({});
	let fullScreen = $state(false);
	let fullScreenText = $state('');

	function handleTrackUnsubscribed(
		track: livekit.RemoteTrack,
		publication: livekit.RemoteTrackPublication,
		participant: livekit.RemoteParticipant
	) {
		// remove tracks from all attached elements
		// const elements = track.detach();
		// elements.forEach((element) => element.remove());
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
					participant: participant.name || participant.identity,
					track,
					kind: track.kind
				};
			}
		} else if (track.kind === livekit.Track.Kind.Audio) {
			if (track.sid && !subscribedAudioTracks[track.sid]) {
				subscribedAudioTracks[track.sid] = {
					participant: participant.name || participant.identity,
					track,
					kind: track.kind
				};
			}
		}
	}

	function showIntialTracks(room: livekit.Room) {
		room.remoteParticipants.forEach((participant) => {
			participant.videoTrackPublications.forEach((publication) => {
				handleTrackSubscribed(publication.track!, publication, participant);
			});
		});
	}

	onMount(async () => {
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
		room.prepareConnection(data.token.livekitServerUrl!, data.token.token);

		await room.connect(data.token.livekitServerUrl!, data.token.token);
		showIntialTracks(room);
		room.on('trackSubscribed', handleTrackSubscribed);
		room.on('trackUnsubscribed', handleTrackUnsubscribed);
		room.on('disconnected', () => {
			goto('/admin');
		});
	});

	function attach(node: HTMLVideoElement) {
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
</script>

<div
	class="max-w-8xl mx-auto mb-40 flex flex-col gap-2 overflow-y-auto px-6 pb-0 pt-4 lg:px-6 lg:pt-4"
>
	<h2 class="font-semibold text-gray-900 md:text-2xl dark:text-gray-300">
		Welcome to Session {data.session.name}!, {data.token.identity}
	</h2>
	<h3 class="font-semibold text-gray-900 md:text-xl dark:text-gray-300">Video Streams</h3>
	<div
		class="grid min-h-0 grid-cols-1 justify-start gap-2 p-2 md:grid-cols-3 lg:grid-cols-4"
		bind:this={videoContainer}
	>
		{#each Object.entries(subscrbedVideoTracks) as [id, trackInfo]}
			<div class="flex flex-col justify-between bg-blue-200 dark:bg-gray-700" style="height:300px;">
				<FullScreen let:onRequest let:onExit>
					<div class="flex-1">
						<!-- svelte-ignore a11y_media_has_caption -->
						<video use:attach class="h-full w-full" {id}></video>
					</div>
					<div class="flex flex-row items-center justify-between text-center">
						<span class="p-2 text-gray-900 dark:text-gray-300">{trackInfo.participant}</span>
						<div class="h-5 w-5">
							<button
								onclick={() => {
									onRequest();
									fullScreen = true;
									fullScreenText = trackInfo.participant;
								}}
							>
								<MdFullscreen role="button" class="p-2 text-xs text-gray-900 dark:text-gray-300" />
							</button>
							<Tooltip class="dark:bg-gray-900" placement="bottom-end">Full Screen View</Tooltip>
						</div>
					</div>
				</FullScreen>
			</div>
		{/each}
	</div>
	<!-- <h3 class="font-semibold text-gray-900 md:text-xl dark:text-gray-300">Audio Steams</h3> -->
</div>
