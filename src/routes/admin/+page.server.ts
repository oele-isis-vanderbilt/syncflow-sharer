import type { PageServerLoad, Actions } from './$types';
import { syncFlowSettings } from '$lib/server/settings';
import { getProjectClient } from '$lib/server/syncflow-client';

const getActiveSessions = async () => {
	return (await getProjectClient().getSessions())
		.map((sessions) => {
			return sessions.filter(
				(session) =>
					session.status === 'Started' && session.comments === 'Created from SyncFlow Sharer'
			);
		})
		.unwrapOr([]);
};

export const load: PageServerLoad = async ({ params }) => {
	const sessions = await getActiveSessions();
	return {
		settings: syncFlowSettings.toJSON(),
		sessions: sessions
	};
};

export const actions = {
	updateSettings: async ({ request }) => {
		const data = await request.formData();
		const enabled = data.get('enabled') as string;
		const enableAudio = data.get('enableAudio') as string;
		const enableCamera = data.get('enableCamera') as string;
		const enableScreenShare = data.get('enableScreenShare') as string;
		const sessionName = data.get('sessionName') as string;
		const recordSession = data.get('recordSession') as string;

		syncFlowSettings.setEnabled(enabled === 'yes');
		syncFlowSettings.setEnableAudio(enableAudio === 'yes');
		syncFlowSettings.setEnableCamera(enableCamera === 'yes');
		syncFlowSettings.setEnableScreenShare(enableScreenShare === 'yes');
		syncFlowSettings.setRecordSession(recordSession === 'yes');
		syncFlowSettings.setSessionName(sessionName);

		return {
			success: true,
			settings: syncFlowSettings.toJSON()
		};
	},
	createSession: async ({}) => {
		const activeSessions = await getActiveSessions();

		const sessionNames = activeSessions.map((session) => session.name);

		let sessionName = syncFlowSettings.getSessionName();

		if (sessionNames.includes(sessionName!)) {
			return {
				success: false,
				errorType: 'sessionExists',
				message: `Session with name ${sessionName} already exists and running, please end the session first.`
			};
		}

		const sessionResult = await getProjectClient().createSession({
			name: sessionName!,
			comments: 'Created from SyncFlow Sharer',
			autoRecording: syncFlowSettings.isSessionRecorded(),
			emptyTimeout: 20000,
			maxParticipants: 100
		});

		await new Promise((resolve) => setTimeout(resolve, 1000));

		return sessionResult
			.map((session) => {
				syncFlowSettings.setSessionName(session.name);
				return {
					success: true,
					session: session
				};
			})
			.unwrapOrElse((error) => {
				return {
					success: false,
					error: error
				};
			});
	},
	endSession: async ({ request }) => {
		const data = await request.formData();
		const sessionId = data.get('sessionId') as string;
		const sessionResult = await getProjectClient().stopSession(sessionId);
		try {
			const session = sessionResult.unwrap();
			return {
				success: true,
				session: session
			};
		} catch (error) {
			return {
				success: false,
				error: JSON.stringify(error)
			};
		}
	}
};
