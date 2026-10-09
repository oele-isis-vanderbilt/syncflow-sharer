<script lang="ts">
	import { page } from '$app/state';
	import {
		Button,
		DarkMode,
		Navbar,
		NavBrand,
		NavHamburger,
		NavLi,
		NavUl,
		Tooltip
	} from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';

	const { user }: { user?: string } = $props();

	let activeUrl = $derived(page.route.id ?? undefined);
</script>

<Navbar fluid class="mx-auto max-w-screen-xl px-4 py-2 dark:bg-gray-900">
	<NavBrand href={resolve('')}>
		<span
			class="text-primary-600 dark:text-primary-400 self-center text-lg font-semibold whitespace-nowrap md:text-2xl"
			>SyncFlow Sharer</span
		>
	</NavBrand>

	<div class="flex items-center gap-1 md:order-2 md:gap-2">
		<!-- Flowbite's DarkMode sets focus:outline-hidden with no replacement; restore a ring. -->
		<DarkMode size="lg" class="focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700" />
		<Tooltip placement="bottom-end">Toggle dark mode</Tooltip>
		{#if user}
			<form action="/login?/logout" method="POST" use:enhance>
				<Button color="alternative" size="sm" type="submit">Log Out</Button>
				<Tooltip placement="bottom-end">Log Out ({user})</Tooltip>
			</form>
		{:else}
			<Button color="alternative" size="sm" href="/login">Log In</Button>
		{/if}
		<NavHamburger />
	</div>

	<!-- Flowbite's active style keeps the base dark:text-gray-400, which is grey on gold in
	     the mobile menu; dark:text-white restores contrast (merged, not replaced).
	     On desktop and on hover, dark mode defaults to white; use gold, as in light mode. -->
	<NavUl
		{activeUrl}
		class="md:order-1"
		classes={{
			active: 'dark:text-white md:dark:text-primary-400',
			nonActive: 'dark:hover:text-primary-400 md:dark:hover:text-primary-400'
		}}
	>
		<NavLi href="/">Home</NavLi>
		<NavLi href="/admin">Admin</NavLi>
	</NavUl>
</Navbar>
