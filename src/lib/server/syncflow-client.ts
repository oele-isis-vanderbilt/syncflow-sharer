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
