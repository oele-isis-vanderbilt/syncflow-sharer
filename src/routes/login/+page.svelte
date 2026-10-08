<script lang="ts">
	import { Alert, Button, Input, Label } from 'flowbite-svelte';
	import { ExclamationCircleOutline } from 'flowbite-svelte-icons';

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
			<Alert color="red">
				{#snippet icon()}<ExclamationCircleOutline class="h-5 w-5" />{/snippet}
				{form?.message}
			</Alert>
		{/if}
		<Button type="submit" color="primary" class="w-full">Log in</Button>
	</form>
</div>
