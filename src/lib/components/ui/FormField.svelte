<!--
	A labelled text input: Label + Input + Helper, with an error state.
	Reference wrapper for src/lib/components/ui/ (see the ui-component skill).
-->
<script lang="ts">
	import { Helper, Input, Label } from 'flowbite-svelte';

	interface Props {
		/** Input id; also links the Label and Helper. */
		id: string;
		/** Form field name; defaults to `id`. */
		name?: string;
		label: string;
		value?: string;
		type?: 'text' | 'password' | 'email' | 'search' | 'url';
		placeholder?: string;
		/** Hint shown under the input. */
		helper?: string;
		/** Error shown under the input; also marks the field invalid. */
		error?: string;
		required?: boolean;
		autocomplete?: HTMLInputElement['autocomplete'];
	}

	let {
		id,
		name = id,
		label,
		value = $bindable(''),
		type = 'text',
		placeholder,
		helper,
		error,
		required = false,
		autocomplete
	}: Props = $props();

	const describedBy = $derived(error || helper ? `${id}-help` : undefined);
</script>

<div class="flex flex-col gap-2">
	<Label for={id} color={error ? 'red' : 'gray'}>{label}</Label>
	<Input
		{id}
		{name}
		{type}
		{placeholder}
		{required}
		{autocomplete}
		color={error ? 'red' : 'default'}
		aria-invalid={error ? true : undefined}
		aria-describedby={describedBy}
		bind:value
	/>
	{#if error}
		<Helper id="{id}-help" color="red">{error}</Helper>
	{:else if helper}
		<Helper id="{id}-help">{helper}</Helper>
	{/if}
</div>
