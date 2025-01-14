<script lang="ts">
	import { Room } from 'livekit-client';
	import { onMount } from 'svelte';
	import { Label, MultiSelect } from 'flowbite-svelte';

	let { audioDeviceIds = $bindable([]), videoDeviceIds = $bindable([]) } = $props();
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

	$effect(() => {
		console.log($state.snapshot(audioDeviceIds), $state.snapshot(videoDeviceIds));
	});
</script>

<h3 class="text-lg font-bold text-gray-900 dark:text-gray-300">Select Devices</h3>
<div class="mt-2 flex w-full flex-col gap-2 p-2 md:flex-row">
	<Label class="w-full">
		Select Microphone(s)
		<MultiSelect class="mt-2" items={audioDevicesSelect} bind:value={audioDeviceIds} />
	</Label>

	<Label class="w-full">
		Select Camera(s)
		<MultiSelect class="mt-2" items={videoDevicesSelect} bind:value={videoDeviceIds} />
	</Label>
</div>
