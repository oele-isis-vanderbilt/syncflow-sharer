<script lang="ts">
	import Navbar from '$lib/components/navbar.svelte';
	import type { Snippet } from 'svelte';
	import '@fontsource-variable/inter';
	import '../app.css';
	import type { LayoutData } from './$types';
	import { ModeWatcher } from 'mode-watcher';
	import Footer from '$lib/components/footer.svelte';
	let { children, data }: { data: LayoutData; children: Snippet } = $props();
</script>

<ModeWatcher track={false} defaultMode={'dark'} />
<div class="flex min-h-screen flex-col bg-white dark:bg-gray-900">
	<header
		class="sticky top-0 z-40 w-full flex-none border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
	>
		<Navbar user={data.user?.name} />
	</header>
	<main class="mx-auto w-full max-w-screen-xl min-w-0 flex-1 px-4 py-8">
		{@render children()}
	</main>
	<Footer />
</div>
