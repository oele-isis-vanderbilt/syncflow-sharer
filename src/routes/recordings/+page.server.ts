import { getProjectClient } from '$lib/server/syncflow-client';
import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';

export interface SessionRecording {
	id: string;
	trackId: string;
	egressId: string;
	startedAt: number;
	egressType: string;
	status: string;
	destination: string;
	roomName: string;
	sessionId: string;
}

export const load: PageServerLoad = async ({ url }) => {
	const sessionId = url.searchParams.get('sessionId');

	if (!sessionId) {
		return error(400, 'Missing required parameters');
	}

	const projectClient = getProjectClient();
	const projectId = projectClient.projectId;
	const projectDetailsResult = await projectClient.getProjectDetails();

	const s3BucketName = projectDetailsResult
		.map((projectDetails) => projectDetails.bucketName)
		.unwrapOr('');
	try {
		const sessionDetials = (await projectClient.getSession(sessionId)).unwrap();
		const sessionRecordingsResult = await projectClient.client.authorizedFetch<SessionRecording[]>(
			`projects/${projectId}/sessions/${sessionId}/egresses`,
			'GET'
		);

		try {
			const sessionRecordings = sessionRecordingsResult.unwrap();
			return {
				recordings: sessionRecordings,
				s3BucketName: s3BucketName,
				sessionDetails: sessionDetials
			};
		} catch (err) {
			return error(err.statusCode || 500, JSON.stringify(err));
		}
	} catch (err) {
		return error(err.statusCode || 500, JSON.stringify(err));
	}
};

export const actions = {
	getFileUrl: async ({ request }) => {
		const data = await request.formData();
		const projectClient = getProjectClient();
		const projectId = process.env.SYNCFLOW_PROJECT_ID!;

		const sessionId = data.get('sessionId') as string;
		const destination = data.get('destination') as string;

		const fileUrlResult = await projectClient.client.authorizedFetch<{ mediaUrl: string }>(
			`projects/${projectId}/sessions/${sessionId}/get-media-url`,
			'POST',
			{
				'Content-Type': 'application/json'
			},
			{
				path: destination
			}
		);

		try {
			const fileInfo = fileUrlResult.unwrap();
			return {
				success: true,
				url: fileInfo.mediaUrl
			};
		} catch (err) {
			return {
				success: false,
				error: JSON.stringify(err)
			};
		}
	}
} satisfies Actions;
