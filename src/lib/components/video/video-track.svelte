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

<!-- Live WebRTC stream: there is no caption track to attach. -->
<!-- svelte-ignore a11y_media_has_caption -->
<video
	use:attachVideo
	class="h-full w-full object-cover"
	id={subscription?.id}
	aria-label={subscription
		? `${subscription.name ?? 'Video'} from ${subscription.participant}`
		: undefined}
></video>
