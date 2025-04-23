<script lang="ts">
	import type { TrackSubscription } from './fullscreen-grid.svelte';

	const { subscription }: { subscription: TrackSubscription | null } = $props();

	function attachVideo(node: HTMLVideoElement) {
		$effect(() => {
			if (node) {
				const track = subscription?.track;
				if (track) {
					track.attach(node);
				}
				return () => {
					if (track) {
						track.detach(node);
					}
				};
			}
		});
	}
</script>

<!-- svelte-ignore a11y_media_has_caption -->
<video use:attachVideo class="h-full w-full object-cover" id={subscription?.id}></video>
