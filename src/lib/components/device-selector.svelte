<script lang="ts">
	import { Room } from 'livekit-client';
	import { onMount } from 'svelte';
	import { Label, Select } from 'flowbite-svelte';

	let { audioDeviceId = $bindable(''), videoDeviceId = $bindable('') } = $props();
	let audioDevicesSelect = $state<{ name: string; value: string }[]>([]);
	let videoDevicesSelect = $state<{ name: string; value: string }[]>([]);

	const mapToSelect = (devices: MediaDeviceInfo[]) => {
		return devices.map((d) => {
			return { value: d.deviceId, name: d.label };
		});
	};

	onMount(async () => {
		try {
			const audioDevices = await Room.getLocalDevices('audioinput');
			const videoDevices = await Room.getLocalDevices('videoinput');
			videoDevicesSelect = mapToSelect(videoDevices);
			audioDevicesSelect = mapToSelect(audioDevices);
		} catch (e) {
			console.error(e);
		}
	});
</script>

<h3 class="text-lg font-bold text-gray-900 dark:text-gray-300">Select Devices</h3>
<div class="mt-2 flex w-full flex-col gap-2 p-2 md:flex-row">
	<Label class="w-full">
		Select Microphone
		<Select class="mt-2" items={audioDevicesSelect} bind:value={audioDeviceId} />
	</Label>

	<Label class="w-full">
		Select Camera
		<Select class="mt-2" items={videoDevicesSelect} bind:value={videoDeviceId} />
	</Label>
</div>
