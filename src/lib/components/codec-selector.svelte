<script lang="ts">
	import { onMount } from 'svelte';
	import { Label, Select } from 'flowbite-svelte';

	let {
		selectedVideoCodec = $bindable(''),
		selectedAudioPreset = $bindable(''),
		selectedVideoPreset = $bindable('')
	} = $props();
	let videoCodecSelect = [
		{ name: 'vp8', value: 'vp8' },
		{ name: 'vp9', value: 'vp9' },
		{ name: 'h264', value: 'h264' }
	];

	let audioPresets = [
		{ value: 'telephone', name: 'Telephone(12KHZ)' },
		{ value: 'speech', name: 'Speech(24KHZ)' },
		{ value: 'music', name: 'Music(48KHZ)' },
		{ value: 'musicStereo', name: 'Music Stereo(64KHZ)' },
		{ value: 'musicHighQuality', name: 'Music High Quality(96KHZ)' },
		{ value: 'musicHighQualityStereo', name: 'Music High Quality Stereo(128KHZ)' }
	];

	let videoPresets = [
		{ value: 'h2160', name: '2160p' },
		{ value: 'h1080', name: '1080p' },
		{ value: 'h720', name: '720p' },
		{ value: 'h540', name: '540p' },
		{ value: 'h360', name: '360p' }
	];

	onMount(async () => {});
</script>

<h3 class="text-lg font-bold text-gray-900 dark:text-gray-300">Select Codecs</h3>
<div class="mt-2 flex w-full flex-col gap-2 p-2 md:flex-row">
	<Label class="w-full">
		Select Video Codec
		<Select class="mt-2" items={videoCodecSelect} bind:value={selectedVideoCodec} />
	</Label>

	<Label class="w-full">
		Select Audio Preset
		<Select class="mt-2" items={audioPresets} bind:value={selectedAudioPreset} />
	</Label>

	<Label class="w-full">
		Select Video Preset
		<Select class="mt-2" items={videoPresets} bind:value={selectedVideoPreset} />
	</Label>
</div>
