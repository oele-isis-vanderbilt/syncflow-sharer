<script lang="ts" module>
	import type { RemoteTrack, Track } from 'livekit-client';

	export interface TrackSubscription {
		id: string;
		participant: string;
		track: RemoteTrack;
		kind: Track.Kind;
		name?: string;
	}
</script>

<script lang="ts">
	import { Tooltip } from 'flowbite-svelte';
	import Fullscreen from './fullscreen.svelte';
	import MdFullscreen from 'svelte-icons/md/MdFullscreen.svelte';
	import { Pagination } from 'flowbite-svelte';

	import { Paginator } from './paginator';
	import VideoTrack from './video-track.svelte';

	let { videos }: { videos: TrackSubscription[] } = $props();

	const maxCols = 4;
	const maxRows = 3;
	const maxPerPage = maxCols * maxRows;

	const paginator = new Paginator<TrackSubscription>(videos, maxPerPage);

	let { currentItems, pages, numPages, totalCells, rows, cols, placeholders } = $derived.by(() => {
		paginator.updateItems(videos);
		let cols = 1;
		let rows = 1;

		if (videos.length === 1) {
			cols = 1;
			rows = 1;
		} else if (videos.length === 2) {
			cols = 2;
			rows = 1;
		} else if (videos.length === 3) {
			cols = 3;
			rows = 1;
		} else if (videos.length === 4) {
			cols = 2;
			rows = 2;
		} else {
			cols = Math.min(maxCols, videos.length);
			rows = Math.min(maxRows, Math.ceil(videos.length / maxCols));
		}

		const totalCells = cols * rows;
		const placeholders =
			totalCells < videos.length ? [] : Array(totalCells - videos.length).fill(null);

		return {
			currentItems: paginator.currentItems,
			pages: paginator.getFlowBitePages(),
			numPages: paginator.totalPages,
			totalCells,
			rows,
			cols,
			placeholders
		};
	});

	function nextPage() {
		paginator.nextPage();
		currentItems = paginator.currentItems;
		pages = paginator.getFlowBitePages();
	}

	function previousPage() {
		paginator.previousPage();
		currentItems = paginator.currentItems;
		pages = paginator.getFlowBitePages();
	}

	function onPageChange(event: Event) {
		let page = 1;
		try {
			page = parseInt((event.target as HTMLElement).innerText);
		} catch (e) {
			console.error(e);
			page = 1;
		}
		paginator.goToPage(page - 1);
		currentItems = paginator.currentItems;
		pages = paginator.getFlowBitePages();
	}
</script>

<Fullscreen>
	{#snippet header(isFull: boolean, requestFs: () => void)}
		<div class={['flex w-full flex-row p-2', isFull ? 'justify-between' : 'justify-end']}>
			{#if isFull}
				<h3 class="font-semibold text-gray-900 md:text-xl dark:text-gray-300">Video Streams</h3>
				{#if numPages > 1}
					<Pagination
						{pages}
						on:next={nextPage}
						on:previous={previousPage}
						on:click={(p) => onPageChange(p)}
					/>
				{/if}
			{/if}
			<div class="h-5 w-5">
				<button onclick={requestFs} class="text-gray-900 dark:text-gray-300">
					<MdFullscreen role="button" class="p-2 text-xs text-black dark:text-gray-300" />
				</button>
			</div>
			<Tooltip class="dark:bg-gray-900" placement="bottom-start"
				>{isFull ? 'Exit' : 'Enter'} Full screen(grid) view</Tooltip
			>
		</div>
	{/snippet}
	{#snippet content()}
		<div
			class="grid h-full w-full gap-2"
			style={`grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr);`}
		>
			{#each currentItems as trackSubscription}
				<div class="relative h-full w-full">
					<VideoTrack subscription={trackSubscription} />
					<div class="absolute inset-0">
						<div class="flex w-full flex-col items-center p-2 opacity-80">
							<p class="bg-gray-950 text-center text-gray-300">{trackSubscription.participant}</p>
							<p class="bg-gray-950 text-center text-gray-300">{trackSubscription.name}</p>
						</div>
					</div>
				</div>
			{/each}

			{#each placeholders as _}
				<div class="h-full w-full bg-black opacity-0"></div>
			{/each}
		</div>
	{/snippet}
</Fullscreen>
