<script lang="ts">
	import FullscreenGrid from '$lib/components/fullscreen-grid/grid.svelte';
	import type { PageProps } from './$types';

	import { onMount } from 'svelte';

	let { data }: PageProps = $props();

	onMount(async () => {});
</script>

<div class="max-w-8xl mx-auto flex flex-col px-2 py-2">
	<FullscreenGrid videos={data.videos} />
</div>
