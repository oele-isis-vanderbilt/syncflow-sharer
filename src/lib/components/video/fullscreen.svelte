<script lang="ts">
	import { browser } from '$app/env';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	let isFull = $state(false);
	let fsContainer: HTMLDivElement | null = $state(null);
	let { content, header }: { content: Snippet; header: Snippet<[boolean, () => void]> } = $props();

	// boring plain js fullscreen support stuff below
	const noop = () => {};

	const fullscreenSupport =
		browser &&
		!!(
			document.fullscreenEnabled ||
			document.webkitFullscreenEnabled ||
			document.mozFullScreenEnabled ||
			document.msFullscreenEnabled ||
			false
		);

	const exitFullscreen = browser
		? (
				document.exitFullscreen ||
				document.mozCancelFullScreen ||
				document.webkitExitFullscreen ||
				document.msExitFullscreen ||
				noop
			).bind(document)
		: noop;

	const requestFullscreen = () => {
		const requestFS = (
			fsContainer?.requestFullscreen ||
			fsContainer?.mozRequestFullScreen ||
			fsContainer?.webkitRequestFullscreen ||
			fsContainer?.msRequestFullscreen ||
			noop
		).bind(fsContainer);
		requestFS();
	};

	onMount(() => {
		const onChange = () => {
			isFull = !!document.fullscreenElement;
		};
		fsContainer?.addEventListener('fullscreenchange', onChange);
		return () => fsContainer?.removeEventListener('fullscreenchange', onChange);
	});

	// handler for the fullscreen button
	const fsToggle = () => {
		if (!fullscreenSupport) return;

		if (isFull) {
			exitFullscreen();
		} else {
			requestFullscreen();
		}
		isFull = !isFull;
	};
</script>

<!-- Fullscreen.svelte -->

<div class={isFull ? 'fs h-screen w-screen' : 'fs'} bind:this={fsContainer}>
	{#if header}
		{@render header(isFull, fsToggle)}
	{/if}
	{#if isFull}
		{@render content()}
	{/if}
</div>
