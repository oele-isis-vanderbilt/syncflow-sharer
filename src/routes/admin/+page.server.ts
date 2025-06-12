import type { PageServerLoad } from './$types';
import { syncFlowSettings } from '$lib/server/settings';
import {
	getProjectClient,
	getSyncflowSharerSessions,
	SYNCFLOW_SHARER_SESSION_COMMENTS
} from '$lib/server/syncflow-client';

const getSessions = async () => {
	return (await getSyncflowSharerSessions())
		.map((sessions) => {
			return {
				active: sessions.filter((session) => session.status === 'Started'),
				ended: sessions
					.filter((session) => session.status !== 'Started')
					.sort((a, b) => {
						return a.startedAt > b.startedAt ? -1 : 1;
					})
			};
		})
		.unwrapOr({
			active: [],
			ended: []
		});
};

export const load: PageServerLoad = async ({ params }) => {
	const sessions = await getSessions();
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
		const activeSessions = (await getSessions()).active;

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
			comments: SYNCFLOW_SHARER_SESSION_COMMENTS,
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
					error: JSON.stringify(error)
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
	},
	deleteSession: async ({ request }) => {
		const data = await request.formData();
		const sessionId = data.get('sessionId') as string;
		const projectClient = getProjectClient();
		const sessionResult = await projectClient.client.authorizedFetch(
			`projects/${projectClient.projectId}/sessions/${sessionId}`,
			'DELETE'
		);
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
