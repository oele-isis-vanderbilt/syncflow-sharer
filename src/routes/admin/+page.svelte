<script lang="ts">
	import {
		Alert,
		Button,
		Card,
		Heading,
		Label,
		MultiSelect,
		P,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Toggle,
		type SelectOptionType
	} from 'flowbite-svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
	import ConfirmButton from '$lib/components/ui/ConfirmButton.svelte';

	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import type { ActionData } from '../$types';

	const { data, form }: { data: PageData; form: ActionData } = $props();
	const sessions = $derived(data.sessions.active);
	const endedSessions = $derived(data.sessions.ended);

	let currentSettings = $derived(data.settings);
	let settingsState = $state({
		enabled: data.settings.enabled,
		enableAudio: data.settings.enableAudio,
		enableCamera: data.settings.enableCamera,
		enableScreenShare: data.settings.enableScreenShare,
		sessionName: data.settings.sessionName ?? '',
		recordSession: data.settings.recordSession,
		selectedDevices: data.settings.selectedDevices || []
	});

	let enableUpdate = $derived.by(() => {
		return (
			currentSettings.enabled !== settingsState.enabled ||
			currentSettings.enableAudio !== settingsState.enableAudio ||
			currentSettings.enableCamera !== settingsState.enableCamera ||
			currentSettings.enableScreenShare !== settingsState.enableScreenShare ||
			(currentSettings.sessionName ?? '') !== settingsState.sessionName ||
			currentSettings.recordSession !== settingsState.recordSession ||
			currentSettings.selectedDevices.some(
				(device) => !settingsState.selectedDevices.includes(device)
			) ||
			settingsState.selectedDevices.some(
				(device) => !currentSettings.selectedDevices.includes(device)
			)
		);
	});

	$effect(() => {
		settingsState = {
			enabled: data.settings.enabled,
			enableAudio: data.settings.enableAudio,
			enableCamera: data.settings.enableCamera,
			enableScreenShare: data.settings.enableScreenShare,
			sessionName: data.settings.sessionName ?? '',
			recordSession: data.settings.recordSession,
			selectedDevices: data.settings.selectedDevices || []
		};
	});

	let devicesToNotify = $derived(
		Array.from(new Set((data.devices || []).map((device) => device.group as string)))
	);

	let selectedDevicesChoices = $derived(
		devicesToNotify.map(
			(device) =>
				({
					value: device,
					name: device
				}) as SelectOptionType<string>
		)
	);
</script>

<div class="flex flex-col gap-6">
	<Heading tag="h1" class="text-3xl md:text-4xl">Admin</Heading>

	<Card size="xl" class="p-4 sm:p-6">
		<Heading tag="h2" class="text-xl">SyncFlow settings</Heading>
		<form class="mt-4 flex flex-col gap-6" method="POST" action="?/updateSettings" use:enhance>
			<Toggle
				bind:checked={settingsState.enabled}
				name="enabled"
				value={settingsState.enabled ? 'yes' : 'no'}>SyncFlow pipeline enabled</Toggle
			>
			{#if settingsState.enabled}
				<Toggle
					name="enableAudio"
					bind:checked={settingsState.enableAudio}
					value={settingsState.enableAudio ? 'yes' : 'no'}>Enable audio sharing</Toggle
				>
				<Toggle
					name="enableCamera"
					bind:checked={settingsState.enableCamera}
					value={settingsState.enableCamera ? 'yes' : 'no'}>Enable camera sharing</Toggle
				>
				<Toggle
					name="enableScreenShare"
					bind:checked={settingsState.enableScreenShare}
					value={settingsState.enableScreenShare ? 'yes' : 'no'}>Enable screen sharing</Toggle
				>
				<Toggle
					name="recordSession"
					bind:checked={settingsState.recordSession}
					value={settingsState.recordSession ? 'yes' : 'no'}>Record session</Toggle
				>
				<FormField
					id="sessionName"
					label="Session name"
					placeholder="Session name"
					bind:value={settingsState.sessionName}
				/>
				<Label class="flex flex-col gap-2">
					Devices to notify
					<MultiSelect
						placeholder="Select devices to notify"
						items={selectedDevicesChoices}
						bind:value={settingsState.selectedDevices}
						name="selectedDevices"
					/>
				</Label>
			{/if}
			{#if enableUpdate}
				<div>
					<Button type="submit" color="alternative">Update Settings</Button>
				</div>
			{/if}
		</form>
	</Card>

	<Card size="xl" class="flex flex-col gap-6 p-4 sm:p-6">
		<div class="flex flex-row items-center justify-between gap-4">
			<Heading tag="h2" class="text-xl">Session manager</Heading>
			{#if currentSettings.enabled}
				<form method="POST" action="?/createSession" use:enhance>
					<Button type="submit" color="primary">Create New Session</Button>
				</form>
			{/if}
		</div>
		{#if !form?.success && form?.errorType === 'sessionExists'}
			<Alert color="red">
				{#snippet icon()}<ExclamationCircleOutline class="h-5 w-5" />{/snippet}
				{form?.message}
			</Alert>
		{/if}

		<section class="flex flex-col gap-4">
			<Heading tag="h3" class="text-lg">Active sessions</Heading>
			{#if sessions.length === 0}
				<P class="text-sm text-gray-500 dark:text-gray-400">No active sessions.</P>
			{:else}
				<Table hoverable>
					<TableHead>
						<TableHeadCell>Name</TableHeadCell>
						<TableHeadCell class="hidden md:table-cell">ID</TableHeadCell>
						<TableHeadCell><span class="sr-only">Actions</span></TableHeadCell>
					</TableHead>
					<TableBody>
						{#each sessions as session (session.id)}
							<TableBodyRow>
								<TableBodyCell>{session.name}</TableBodyCell>
								<TableBodyCell class="hidden font-mono text-xs md:table-cell"
									>{session.id}</TableBodyCell
								>
								<TableBodyCell>
									<div class="flex justify-end gap-2">
										<Button
											color="alternative"
											size="sm"
											target="_blank"
											href="/preview?sessionId={session.id}">Preview</Button
										>
										<ConfirmButton
											action="?/endSession"
											fields={{ sessionId: session.id }}
											label="End Session"
											size="sm"
											title="End this session?"
											message={`Ending "${session.name}" disconnects everyone sharing into it. This can't be undone.`}
										/>
									</div>
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</section>

		<section class="flex flex-col gap-4">
			<Heading tag="h3" class="text-lg">Ended sessions</Heading>
			{#if endedSessions.length === 0}
				<P class="text-sm text-gray-500 dark:text-gray-400">No ended sessions.</P>
			{:else}
				<Table hoverable>
					<TableHead>
						<TableHeadCell>Name</TableHeadCell>
						<TableHeadCell class="hidden md:table-cell">ID</TableHeadCell>
						<TableHeadCell><span class="sr-only">Actions</span></TableHeadCell>
					</TableHead>
					<TableBody>
						{#each endedSessions as session (session.id)}
							<TableBodyRow>
								<TableBodyCell>{session.name}</TableBodyCell>
								<TableBodyCell class="hidden font-mono text-xs md:table-cell"
									>{session.id}</TableBodyCell
								>
								<TableBodyCell>
									<div class="flex justify-end gap-2">
										<Button color="alternative" size="sm" href="/recordings?sessionId={session.id}"
											>Recordings</Button
										>
										<ConfirmButton
											action="?/deleteSession"
											fields={{ sessionId: session.id }}
											label="Delete Session"
											size="sm"
											title="Delete this session?"
											message={`Deleting "${session.name}" removes it from SyncFlow. This can't be undone.`}
										/>
									</div>
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</section>
	</Card>
</div>
