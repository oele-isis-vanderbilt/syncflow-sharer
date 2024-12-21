<script lang="ts">
	import { page } from '$app/state';
</script>

<main
	class="h-full min-w-0 flex-auto divide-y lg:static lg:max-h-full lg:overflow-visible dark:divide-gray-700 dark:bg-gray-900"
>
	<div class="max-w-8xl mx-auto flex flex-col items-center justify-center px-2 py-2 text-center">
		{#if page.error}
			<h1 class="text-2xl font-semibold text-gray-900 md:text-4xl dark:text-gray-300">Error</h1>
			<p class="p-2 text-gray-900 dark:text-gray-300">
				An error occurred while processing your request. Please try again later.
			</p>
			<p class="p-2 text-gray-900 dark:text-gray-300">
				{page.error.message} | Status Code {page.status} | Go <a href="/" class="underline">Home</a>
			</p>
		{/if}
	</div>
</main>
