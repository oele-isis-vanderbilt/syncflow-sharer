<script lang="ts" module>
	import type { RemoteTrack, Track } from 'livekit-client';

	export interface TrackSubscription {
		participant: string;
		track: RemoteTrack;
		kind: Track.Kind;
		name?: string;
	}
</script>

<script lang="ts">

    const {subscrbedVideoTracks} : {subscribedVideoTracks: Record<string, TrackSubscription>} = $props();
    
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
</script>

<div class="w-full h-full" id="videoContainer">
    {#each Object.entries(subscrbedVideoTracks) as [id, trackInfo]}
        <div class="w-full h-full">
            <!-- svelte-ignore a11y_media_has_caption -->
            <video
                id={trackInfo.track.sid}
                class="w-full h-full"
                autoplay
                use:attachVideo
            ></video>
        </div>
    {/each}
</div>