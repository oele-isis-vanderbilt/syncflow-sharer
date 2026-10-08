<!--
	A destructive form action that asks first: a red Button opens a Modal, and the
	Modal's confirm button submits a hidden SvelteKit form (progressively enhanced).
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Modal, P } from 'flowbite-svelte';

	interface Props {
		/** Form action, e.g. `?/endSession`. */
		action: string;
		/** Hidden inputs posted with the form. */
		fields?: Record<string, string>;
		/** Text on the trigger button. */
		label: string;
		/** Modal heading. */
		title: string;
		/** Explains what will happen. */
		message: string;
		/** Text on the confirm button; defaults to `label`. */
		confirmLabel?: string;
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	}

	let {
		action,
		fields = {},
		label,
		title,
		message,
		confirmLabel = label,
		size = 'md'
	}: Props = $props();

	const formId = $props.id();
	let open = $state(false);
</script>

<form
	id={formId}
	method="POST"
	{action}
	use:enhance={() => {
		open = false;
		return ({ update }) => update();
	}}
>
	{#each Object.entries(fields) as [name, value] (name)}
		<input type="hidden" {name} {value} />
	{/each}
</form>

<Button color="red" {size} onclick={() => (open = true)}>{label}</Button>

<Modal bind:open {title} size="sm">
	<P>{message}</P>
	{#snippet footer()}
		<Button color="red" type="submit" form={formId}>{confirmLabel}</Button>
		<Button color="alternative" data-autofocus onclick={() => (open = false)}>Cancel</Button>
	{/snippet}
</Modal>
