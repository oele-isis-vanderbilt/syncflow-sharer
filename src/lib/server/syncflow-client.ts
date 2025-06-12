import { ProjectClientBuilder, type ProjectClient } from 'syncflow-node-client';

let projectClient: ProjectClient | null = null;

export const getProjectClient = () => {
	if (!projectClient) {
		projectClient = new ProjectClientBuilder()
			.setApiKey(process.env.SYNCFLOW_API_KEY!)
			.setApiSecret(process.env.SYNCFLOW_API_SECRET!)
			.setProjectId(process.env.SYNCFLOW_PROJECT_ID!)
			.setServerUrl(process.env.SYNCFLOW_SERVER_URL!)
			.build();
	}
	return projectClient;
};

export const SYNCFLOW_SHARER_SESSION_COMMENTS = 'Created from SyncFlow Sharer';
export async function getSyncflowSharerSessions() {
	const projectClient = getProjectClient();
	const sessionsResult = await projectClient.getSessions();

	if (process.env.SHOW_ALL_SESSIONS === 'true') {
		return sessionsResult;
	} else {
		return sessionsResult.map((sessions) => {
			return sessions.filter((s) => s.comments === SYNCFLOW_SHARER_SESSION_COMMENTS);
		});
	}
}
