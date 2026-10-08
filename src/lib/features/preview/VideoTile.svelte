<!-- One subscribed video track: the stream, its label, and a fullscreen control. -->
<script lang="ts">
	import { Button, Tooltip } from 'flowbite-svelte';
	import { ExpandOutline } from 'flowbite-svelte-icons';
	import type { TrackSubscription } from '$lib/components/video/fullscreen-grid.svelte';
	import Fullscreen from '$lib/components/video/fullscreen.svelte';
	import VideoTrack from '$lib/components/video/video-track.svelte';

	interface Props {
		subscription: TrackSubscription;
		label: string;
	}

	let { subscription, label }: Props = $props();
</script>

<div class="flex h-72 flex-col gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
	<div class="min-h-0 flex-1">
		<VideoTrack {subscription} />
	</div>
	<div class="flex items-center justify-between gap-2">
		<span class="truncate text-sm text-gray-900 dark:text-white">{label}</span>
		<Tooltip>{label}</Tooltip>
		<Fullscreen>
			{#snippet header(isFull, requestFs)}
				{#if !isFull}
					<Button
						color="alternative"
						size="xs"
						class="p-1.5"
						aria-label="View {label} full screen"
						onclick={() => requestFs()}
					>
						<ExpandOutline class="h-4 w-4" />
					</Button>
				{/if}
			{/snippet}
			{#snippet content()}
				<VideoTrack {subscription} />
			{/snippet}
		</Fullscreen>
	</div>
</div>
