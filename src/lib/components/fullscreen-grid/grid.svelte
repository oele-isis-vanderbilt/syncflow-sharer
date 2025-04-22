<script lang="ts">
	import { Tooltip } from 'flowbite-svelte';
	import Fullscreen from './fullscreen.svelte';
	import MdFullscreen from 'svelte-icons/md/MdFullscreen.svelte';
	import { Pagination } from 'flowbite-svelte';

	import { Paginator } from './paginator';
	let { videos }: { src: string; title: string }[] = $props();
	const maxCols = 4;
	const maxRows = 3;
	const maxPerPage = maxCols * maxRows;
	let cols = $state(1);
	let rows = $state(1);
	const paginator = new Paginator<{ src: string; title: string }>(videos, maxPerPage);
	const numPages = paginator.totalPages;

	let pages = $state(paginator.getFlowBitePages());

	let currentItems = $state(paginator.currentItems);

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

	const totalCells = $derived(cols * rows);
	let placeholders = $derived.by(() => {
		if (totalCells < videos.length) {
			return [];
		}
		return Array(totalCells - videos.length).fill(null);
	});
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
				>{isFull ? 'Exit' : 'Enter'} Full Screen(grid) View [todo]</Tooltip
			>
		</div>
	{/snippet}
	{#snippet content()}
		<div
			class="grid h-full w-full gap-2"
			style={`grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr);`}
		>
			{#each currentItems as video}
				<div class="relative h-full w-full">
					<video class="h-full w-full flex-1 object-cover" autoplay loop muted playsinline>
						<source src={video.src} type="video/mp4" />
						Your browser does not support the video tag.
					</video>
					<div class="absolute inset-0">
						<p class="bg-gray-950 text-center text-gray-300">{video.title}</p>
					</div>
				</div>
			{/each}

			{#each placeholders as _}
				<div class="h-full w-full bg-black opacity-0"></div>
			{/each}
		</div>
	{/snippet}
</Fullscreen>
