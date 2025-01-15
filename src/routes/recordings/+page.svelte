<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { Accordion, AccordionItem, Button, Toggle } from 'flowbite-svelte';

	const { data }: { data: PageData } = $props();

	let mode = $state<'participant' | 'all'>('participant');

	const recordingsByPartcipants = data.recordings.reduce(
		(acc, recording) => {
			const participant = getParticipantNameFromDestination(recording.destination);
			if (!acc[participant]) {
				acc[participant] = [];
			}
			acc[participant].push(recording);
			return acc;
		},
		{} as Record<string, any>
	);

	function getFileName(path: string) {
		const parts = path.split('/');
		return parts[parts.length - 1];
	}

	function getParticipantNameFromDestination(destination: string) {
		const parts = destination.split('/');
		return parts[3];
	}
</script>

<div class="max-w-8xl mx-auto flex flex-col px-6 py-6 lg:px-6 lg:py-6">
	<h2 class="font-semibold text-gray-900 md:text-2xl dark:text-gray-300">
		Session ({data.sessionDetails.name})
	</h2>
	<div>
		<span class="text-gray-900 dark:text-gray-300">
			BucketName: {data.s3BucketName}
		</span>
	</div>
	<div class="mt-5 flex flex-row justify-between">
		<h2 class=" font-semibold text-gray-900 md:text-xl dark:text-gray-300">Recordings</h2>
		<Toggle
			checked={mode === 'participant'}
			on:change={() => {
				mode = mode === 'participant' ? 'all' : 'participant';
			}}
		>
			Group by Participant
		</Toggle>
	</div>
	<div class="mb-20 mt-6">
		{#if data.recordings.length === 0}
			<p class="text-black dark:text-gray-300">Recordings not Found and or empty.</p>
		{:else if mode === 'participant'}
			<Accordion class="mb-20 h-full w-full">
				{#each Object.entries(recordingsByPartcipants) as [participant, recordings]}
					<AccordionItem>
						<span slot="header">{participant}</span>
						<ul class="flex w-full flex-col gap-2 overflow-auto text-center">
							{#each recordings as recording}
								<li
									class="flex flex-col items-center justify-between gap-2 rounded-lg bg-gray-100 p-2 text-center md:flex-row dark:bg-gray-800"
								>
									<span class="flex-1 text-black md:block dark:text-gray-300"
										>{getFileName(recording.destination || '/')}</span
									>
									<span class="hidden flex-1 text-black md:block dark:text-gray-300"
										>{recording.trackId}</span
									>
									<span class="hidden flex-1 text-black md:block dark:text-gray-300"
										>{recording.status}</span
									>
									<span class="hidden flex-1 text-black md:block dark:text-gray-300"
										>{new Date(recording.startedAt / 1000000).toLocaleString()}</span
									>

									<form
										method="POST"
										action="?/getFileUrl"
										use:enhance={(/*params*/) => {
											return async ({ result }) => {
												if (result.status === 200) {
													window.open(result.data.url, '_blank');
												} else {
													alert('Failed to download file');
												}
											};
										}}
									>
										<input type="hidden" name="sessionId" value={recording.sessionId} />
										<input type="hidden" name="destination" value={recording.destination} />
										<Button type="submit" class="flex-1 rounded-lg bg-blue-700 px-4 py-2 text-white"
											>Download</Button
										>
									</form>
								</li>
							{/each}
						</ul>
					</AccordionItem>
				{/each}
			</Accordion>
		{:else}
			<ul class="flex w-full flex-col gap-2 overflow-auto text-center">
				{#each data.recordings as recording}
					<li
						class="flex flex-col items-center justify-between gap-2 rounded-lg bg-gray-100 p-2 text-center md:flex-row dark:bg-gray-800"
					>
						<span class="flex-1 text-black md:block dark:text-gray-300"
							>{getFileName(recording.destination || '/')}</span
						>
						<span class="hidden flex-1 text-black md:block dark:text-gray-300"
							>{recording.trackId}</span
						>
						<span class="hidden flex-1 text-black md:block dark:text-gray-300"
							>{recording.status}</span
						>
						<span class="hidden flex-1 text-black md:block dark:text-gray-300"
							>{new Date(recording.startedAt / 1000000).toLocaleString()}</span
						>

						<form method="POST" action="?/getFileUrl" use:enhance>
							<input type="hidden" name="sessionId" value={recording.sessionId} />
							<Button type="submit" class="flex-1 rounded-lg bg-blue-700 px-4 py-2 text-white"
								>Download</Button
							>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
