<script lang="ts">
	import { page } from '$app/state';
	import { A, Heading, P } from 'flowbite-svelte';
</script>

<div class="flex flex-col items-center gap-4 py-12 text-center">
	{#if page.error}
		<Heading tag="h1" class="text-3xl md:text-4xl">Error {page.status}</Heading>
		<P class="text-gray-500 dark:text-gray-400">
			An error occurred while processing your request. Please try again later.
		</P>
		<P>{page.error.message}</P>
		<A href="/" class="text-primary-600 dark:text-primary-500">Go home</A>
	{/if}
</div>
