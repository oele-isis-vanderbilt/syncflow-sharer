<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import {
		Accordion,
		AccordionItem,
		Badge,
		Button,
		Card,
		Heading,
		P,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Toast,
		Toggle
	} from 'flowbite-svelte';
	import { ExclamationCircleOutline } from 'flowbite-svelte-icons';

	type Recording = PageData['recordings'][number];

	const { data }: { data: PageData } = $props();

	let mode = $state<'participant' | 'all'>('participant');
	let downloadError = $state(false);

	const recordingsByPartcipants = data.recordings.reduce(
		(acc, recording) => {
			const participant = getParticipantNameFromDestination(recording.destination);
			if (!acc[participant]) {
				acc[participant] = [];
			}
			acc[participant].push(recording);
			return acc;
		},
		{} as Record<string, Recording[]>
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

{#snippet recordingsTable(recordings: Recording[])}
	<Table hoverable>
		<TableHead>
			<TableHeadCell>File</TableHeadCell>
			<TableHeadCell class="hidden md:table-cell">Track</TableHeadCell>
			<TableHeadCell class="hidden md:table-cell">Status</TableHeadCell>
			<TableHeadCell class="hidden md:table-cell">Started</TableHeadCell>
			<TableHeadCell><span class="sr-only">Download</span></TableHeadCell>
		</TableHead>
		<TableBody>
			{#each recordings as recording}
				<TableBodyRow>
					<TableBodyCell class="font-mono text-xs"
						>{getFileName(recording.destination || '/')}</TableBodyCell
					>
					<TableBodyCell class="hidden font-mono text-xs md:table-cell"
						>{recording.trackId}</TableBodyCell
					>
					<TableBodyCell class="hidden md:table-cell">
						<Badge color="gray">{recording.status}</Badge>
					</TableBodyCell>
					<TableBodyCell class="hidden md:table-cell"
						>{new Date(recording.startedAt / 1000000).toLocaleString()}</TableBodyCell
					>
					<TableBodyCell class="text-end">
						<form
							method="POST"
							action="?/getFileUrl"
							use:enhance={() => {
								return async ({ result }) => {
									if (result.status === 200) {
										window.open(result.data.url, '_blank');
									} else {
										downloadError = true;
									}
								};
							}}
						>
							<input type="hidden" name="sessionId" value={recording.sessionId} />
							<input type="hidden" name="destination" value={recording.destination} />
							<Button type="submit" color="alternative" size="sm">Download</Button>
						</form>
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{/snippet}

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-2">
		<Heading tag="h1" class="text-3xl md:text-4xl">Recordings: {data.sessionDetails.name}</Heading>
		<P class="text-sm text-gray-500 dark:text-gray-400">Bucket: {data.s3BucketName}</P>
	</div>

	<Card size="xl" class="flex flex-col gap-4 p-4 sm:p-6">
		<div class="flex flex-row items-center justify-between gap-4">
			<Heading tag="h2" class="text-xl">Files</Heading>
			<Toggle
				checked={mode === 'participant'}
				onchange={() => {
					mode = mode === 'participant' ? 'all' : 'participant';
				}}>Group by participant</Toggle
			>
		</div>
		{#if data.recordings.length === 0}
			<P class="text-sm text-gray-500 dark:text-gray-400">No recordings found for this session.</P>
		{:else if mode === 'participant'}
			<Accordion>
				{#each Object.entries(recordingsByPartcipants) as [participant, recordings] (participant)}
					<AccordionItem>
						{#snippet header()}{participant}{/snippet}
						{@render recordingsTable(recordings)}
					</AccordionItem>
				{/each}
			</Accordion>
		{:else}
			{@render recordingsTable(data.recordings)}
		{/if}
	</Card>
</div>

{#if downloadError}
	<Toast color="red" class="fixed end-5 bottom-5 z-50" bind:toastStatus={downloadError}>
		{#snippet icon()}<ExclamationCircleOutline class="h-5 w-5" />{/snippet}
		Failed to download the file.
	</Toast>
{/if}
