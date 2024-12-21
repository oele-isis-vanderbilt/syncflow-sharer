<script lang="ts">
	import Footer from '$lib/components/footer.svelte';

	import { Button, Input, Label } from 'flowbite-svelte';

	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="flex items-center justify-center p-6 sm:p-8 md:p-12">
	<form class="flex w-full max-w-sm flex-col space-y-6" method="POST" action="?/login">
		<h3 class="text-xl font-medium text-gray-900 dark:text-white">Log In</h3>
		<Label class="space-y-2">
			<span>Username</span>
			<Input
				type="text"
				name="username"
				placeholder="username"
				required
				class="bg-white text-gray-800 focus:bg-white dark:bg-gray-700 dark:text-gray-300 focus:dark:bg-gray-700"
				autocomplete="on"
			/>
		</Label>
		<Label class="space-y-2">
			<span>Your password</span>
			<Input
				type="password"
				name="password"
				placeholder="•••••"
				autocomplete="on"
				class="bg-white text-gray-800 focus:bg-white dark:bg-gray-700 dark:text-gray-300 focus:dark:bg-gray-700"
				required
			/>
		</Label>
		{#if form?.incorrect}
			<p class="text-red-800">{form?.message}</p>
		{/if}
		<Button type="submit" class="w-full bg-red-800">Log in</Button>
	</form>
</div>
<Footer />
