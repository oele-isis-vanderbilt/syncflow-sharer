<script lang="ts">
	import { Button, Toggle } from 'flowbite-svelte';

	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
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
		sessionName: data.settings.sessionName,
		recordSession: data.settings.recordSession
	});

	let enableUpdate = $derived.by(() => {
		return (
			currentSettings.enabled !== settingsState.enabled ||
			currentSettings.enableAudio !== settingsState.enableAudio ||
			currentSettings.enableCamera !== settingsState.enableCamera ||
			currentSettings.enableScreenShare !== settingsState.enableScreenShare ||
			currentSettings.sessionName !== settingsState.sessionName ||
			currentSettings.recordSession !== settingsState.recordSession
		);
	});

	$effect(() => {
		settingsState = {
			enabled: data.settings.enabled,
			enableAudio: data.settings.enableAudio,
			enableCamera: data.settings.enableCamera,
			enableScreenShare: data.settings.enableScreenShare,
			sessionName: data.settings.sessionName,
			recordSession: data.settings.recordSession
		};
	});
</script>

<div class="max-w-8xl mx-auto flex flex-col px-6 py-6 lg:px-6 lg:py-6">
	<h2 class="font-semibold text-gray-900 md:text-2xl dark:text-gray-300">SyncFlow Settings</h2>
	<form method="POST" action="?/updateSettings" use:enhance>
		<div class="mt-6 flex flex-row text-gray-900 dark:text-gray-300">
			<span>{settingsState.enabled ? 'Disable' : 'Enable'} SyncFlow Pipeline</span>
			<Toggle
				bind:checked={settingsState.enabled}
				name="enabled"
				class="ms-auto"
				value={settingsState.enabled ? 'yes' : 'no'}
			/>
		</div>
		{#if settingsState.enabled}
			<Toggle
				name="enableAudio"
				bind:checked={settingsState.enableAudio}
				class="mt-6"
				value={settingsState.enableAudio ? 'yes' : 'no'}>Enable Audio Sharing</Toggle
			>
			<Toggle
				name="enableCamera"
				bind:checked={settingsState.enableCamera}
				class="mt-6"
				value={settingsState.enableCamera ? 'yes' : 'no'}>Enable Camera Sharing</Toggle
			>
			<Toggle
				name="enableScreenShare"
				bind:checked={settingsState.enableScreenShare}
				class="mt-6"
				value={settingsState.enableScreenShare ? 'yes' : 'no'}>Enable Screen Sharing</Toggle
			>
			<Toggle
				name="recordSession"
				bind:checked={settingsState.recordSession}
				class="mt-6"
				value={settingsState.recordSession ? 'yes' : 'no'}>Record Session</Toggle
			>
			<input
				type="text"
				name="sessionName"
				bind:value={settingsState.sessionName}
				class="mt-6 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 dark:bg-gray-800 dark:text-gray-300"
				placeholder="Session Name"
			/>
		{/if}
		{#if enableUpdate}
			<Button type="submit" class="mt-6 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white"
				>Update Settings</Button
			>
		{/if}
	</form>
	<div class="flex flex-row items-center justify-between">
		<h2 class="mt-5 font-semibold text-gray-900 md:text-2xl dark:text-gray-300">Session Manager</h2>
		{#if currentSettings.enabled}
			<form method="POST" action="?/createSession" use:enhance>
				<Button type="submit" class="mt-6 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white"
					>Create New Session</Button
				>
			</form>
		{/if}
	</div>
	{#if !form?.success && form?.errorType === 'sessionExists'}
		<p class="text-red-800">{form?.message}</p>
	{/if}
	<h2 class="mt-5 font-semibold text-gray-900 md:text-xl dark:text-gray-300">Active Sessions</h2>
	<div class="mt-6">
		{#if sessions.length === 0}
			<p class="text-black dark:text-gray-300">No active sessions</p>
		{:else}
			<ul class="flex flex-col gap-2 overflow-auto">
				{#each sessions as session}
					<li
						class="flex flex-col items-center justify-between gap-2 rounded-lg bg-gray-100 p-2 md:flex-row dark:bg-gray-800"
					>
						<span class="text-black md:block dark:text-gray-300">{session.name}</span>
						<span class="hidden text-black md:block dark:text-gray-300">{session.id}</span>

						<button
							class="rounded-lg bg-blue-700 px-4 py-2 text-white"
							onclick={() => goto(`/preview?sessionId=${session.id}`)}>Preview Session</button
						>
						<form method="POST" action="?/endSession" use:enhance>
							<input type="hidden" name="sessionId" value={session.id} />
							<Button type="submit" class="rounded-lg bg-red-700 px-4 py-2 text-white"
								>End Session</Button
							>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<h2 class="mt-5 font-semibold text-gray-900 md:text-xl dark:text-gray-300">Ended Sessions</h2>
	<div class="mb-20 mt-6">
		{#if endedSessions.length === 0}
			<p class="text-black dark:text-gray-300">No ended sessions</p>
		{:else}
			<ul class="flex flex-col gap-2 overflow-auto text-center">
				{#each endedSessions as session}
					<li
						class="flex flex-col items-center justify-between gap-2 rounded-lg bg-gray-100 p-2 text-center md:flex-row dark:bg-gray-800"
					>
						<span class="flex-1 text-black md:block dark:text-gray-300">{session.name}</span>
						<span class="hidden flex-1 text-black md:block dark:text-gray-300">{session.id}</span>
						<button
							class="flex-1 rounded-lg bg-blue-700 px-4 py-2 text-white"
							onclick={() => goto(`/recordings?sessionId=${session.id}`)}>View Recordings</button
						>
						<form method="POST" action="?/deleteSession" use:enhance>
							<input type="hidden" name="sessionId" value={session.id} />
							<Button type="submit" class="flex-1 rounded-lg bg-red-700 px-4 py-2 text-white"
								>Delete Session</Button
							>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
