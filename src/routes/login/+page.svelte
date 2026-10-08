<script lang="ts">
	import { Alert, Button, Card, Heading } from 'flowbite-svelte';
	import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
	import FormField from '$lib/components/ui/FormField.svelte';

	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="flex justify-center py-12">
	<Card class="p-4 sm:p-6">
		<form class="flex flex-col gap-6" method="POST" action="?/login">
			<Heading tag="h1" class="text-3xl">Log In</Heading>
			<FormField id="username" label="Username" required autocomplete="username" />
			<FormField
				id="password"
				label="Password"
				type="password"
				required
				autocomplete="current-password"
			/>
			{#if form?.incorrect}
				<Alert color="red">
					{#snippet icon()}<ExclamationCircleOutline class="h-5 w-5" />{/snippet}
					{form?.message}
				</Alert>
			{/if}
			<Button type="submit" color="primary" class="w-full">Log in</Button>
		</form>
	</Card>
</div>
