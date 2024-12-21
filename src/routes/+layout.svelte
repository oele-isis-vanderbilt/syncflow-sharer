<script lang="ts">
	import Navbar from '$lib/components/navbar.svelte';
	import type { Snippet } from 'svelte';
	import '../app.css';
	import type { LayoutData } from './$types';
	import { ModeWatcher } from 'mode-watcher';
	import Footer from '$lib/components/footer.svelte';
	let { children, data }: { data: LayoutData; children: Snippet } = $props();
</script>

<ModeWatcher />
<header
	class="sticky top-0 z-40 mx-auto w-full flex-none border-b border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-900"
>
	<Navbar user={data.user?.name} />
</header>
<main
	class="h-full min-w-0 flex-auto divide-y overflow-auto lg:static lg:max-h-full lg:overflow-visible dark:divide-gray-700 dark:bg-gray-900"
>
	{@render children()}
	<Footer />
</main>
