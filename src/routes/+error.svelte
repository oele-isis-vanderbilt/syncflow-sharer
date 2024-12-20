<script lang="ts">
    import { page } from '$app/state';
</script>

<main
	class="h-full min-w-0 flex-auto divide-y lg:static lg:max-h-full lg:overflow-visible dark:divide-gray-700 dark:bg-gray-900"
>
	<div class="max-w-8xl mx-auto flex flex-col px-2 py-2">
        {#if page.error}
            <h1 class="text-4xl font-semibold text-gray-900 dark:text-gray-300">Error</h1>
            <p class="text-gray-900 dark:text-gray-300">An error occurred while processing your request. Please try again later.</p>
            <p class="text-gray-900 dark:text-gray-300">{page.error.message}</p>
        {/if}
    </div>
</main>