<script lang="ts">
	import { goto } from '$app/navigation';
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
	import { dev } from '$app/env';
	import { enhance } from '$app/forms';

	let divClass = 'w-full ms-auto lg:block lg:w-auto order-1 lg:order-none';
	let ulClass =
		'flex flex-col py-3 my-4 lg:flex-row lg:my-0 text-sm font-medium text-gray-900 dark:text-gray-300 gap-4';

	const { user } = $props();

	let activeUrl = $derived(page.route.id);
</script>

<Navbar fluid class="mx-auto max-w-screen-xl px-4 py-2 dark:bg-gray-900">
	<NavBrand href={resolve('')}>
		<span
			class="self-center font-semibold whitespace-nowrap text-gray-900 md:text-2xl dark:text-white"
			>SyncFlow Sharer</span
		>
	</NavBrand>

	<NavHamburger />
	<NavUl
		class={divClass}
		{activeUrl}
		classes={{
			ul: ulClass,
			nonActive:
				'md:!ps-3 md:!py-2 lg:!ps-0 text-gray-700 hover:bg-gray-100 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 dark:text-gray-400 lg:dark:text-white lg:dark:hover:text-primary-400 dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent',
			active:
				'md:!ps-3 md:!py-2 lg:!ps-0 text-white bg-primary-700 lg:bg-transparent lg:text-primary-700 lg:dark:text-primary-400 dark:bg-primary-600 lg:dark:bg-transparent cursor-default'
		}}
	>
		<NavLi class="lg:mb-0 lg:px-2" href="/">Home</NavLi>
		<NavLi class="lg:mb-0 lg:px-2" href="/admin">Admin</NavLi>
	</NavUl>

	<div class="ms-auto flex items-center">
		<DarkMode size="lg" class="inline-block hover:text-gray-900 dark:hover:text-white" />
		<Tooltip class="dark:bg-gray-900" placement="bottom-end">Toggle dark mode</Tooltip>
		{#if user}
			<form action="/login?/logout" method="POST" use:enhance>
				<Button class="ms-3" color="alternative" size="md" type="submit">Log Out</Button>
				<Tooltip class="dark:bg-gray-900" placement="bottom-end">Log Out ({user})</Tooltip>
			</form>
		{:else}
			<Button class="ms-3" color="alternative" size="md" onclick={() => goto('/login')}
				>Log In</Button
			>
		{/if}
	</div>
</Navbar>
