<script lang="ts">
	import { onMount } from 'svelte';
	import { Label, Select } from 'flowbite-svelte';

	let { selectedVideoCodec = $bindable('') } = $props();
	let videoCodecSelect = [
		{ name: 'vp8', value: 'vp8' },
		{ name: 'vp9', value: 'vp9' },
		{ name: 'h264', value: 'h264' }
	];

	onMount(async () => {});
</script>

<h3 class="text-lg font-bold text-gray-900 dark:text-gray-300">Select Codecs</h3>
<div class="mt-2 flex w-full flex-col gap-2 p-2 md:flex-row">
	<Label class="w-full">
		Select Video Codec
		<Select class="mt-2" items={videoCodecSelect} bind:value={selectedVideoCodec} />
	</Label>
</div>
