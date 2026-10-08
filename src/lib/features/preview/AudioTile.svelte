<!-- One subscribed audio track: muted playback controls and its labels. -->
<script lang="ts">
	import type { TrackSubscription } from '$lib/components/video/fullscreen-grid.svelte';

	interface Props {
		subscription: TrackSubscription;
		label: string;
		/** Secondary line, e.g. the participant. */
		sublabel?: string;
	}

	let { subscription, label, sublabel }: Props = $props();

	function attachAudio(node: HTMLAudioElement) {
		$effect(() => {
			const track = subscription.track;
			track.attach(node);
			node.muted = true;
			return () => {
				track.detach(node);
			};
		});
	}
</script>

<div class="flex h-36 flex-col justify-between gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
	<audio use:attachAudio class="w-full" controls aria-label="{label} audio"></audio>
	<div class="flex flex-col text-center">
		{#if sublabel}
			<span class="truncate text-sm text-gray-500 dark:text-gray-400">{sublabel}</span>
		{/if}
		<span class="truncate text-sm text-gray-900 dark:text-white">{label}</span>
	</div>
</div>
