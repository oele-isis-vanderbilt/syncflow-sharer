import { getProjectClient } from '$lib/server/syncflow-client';
import type { PageServerLoad } from './$types';
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
