import { getMinioClient } from '$lib/server/s3-client';
import { getProjectClient } from '$lib/server/syncflow-client';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { syncFlowSettings } from '$lib/server/settings';

export const GET: RequestHandler = async ({ request, url }) => {
	if (process.env.ENABLE_TOKEN_ENDPOINT !== 'true') {
		return error(401, 'Token endpoint not authorized');
	}

	const identity = url.searchParams.get('identity');
	if (!identity) {
		return error(400, 'No identity provided');
	}

	const projectClient = getProjectClient();

	const activeSessionsResult = await projectClient.getSessions();

	try {
		const sessions = activeSessionsResult.unwrap();
		let session = sessions.find(
			(s) => s.status === 'Started' && s.comments === 'Created from SyncFlow Sharer'
		);

		if (!session) {
			const sessionResult = await projectClient.createSession({
				name: syncFlowSettings.sessionName || '',
				comments: 'Created from SyncFlow Sharer',
				maxParticipants: 200,
				emptyTimeout: 200000,
				autoRecording: syncFlowSettings.recordSession
			});

			try {
				session = sessionResult.unwrap();
			} catch (err) {
				return error(err.statusCode || 500, JSON.stringify(err));
			}
		}

		if (session) {
			const tokenResult = await projectClient.generateSessionToken(session.id, {
				identity: identity,
				name: identity,
				videoGrants: {
					canPublish: true,
					canPublishData: true,
					canPublishSources: ['camera', 'screen_share', 'screen_share_audio', 'microphone'],
					canSubscribe: true,
					canUpdateOwnMetadata: true,
					hidden: false,
					ingressAdmin: true,
					recorder: true,
					room: session.name,
					roomAdmin: true,
					roomCreate: true,
					roomJoin: true,
					roomList: true,
					roomRecord: true
				}
			});

			return tokenResult
				.map((t) => json(t))
				.unwrapOrElse((err) => error(500, 'Error generating token\n' + JSON.stringify(err)));
		}
	} catch (err) {
		throw error(500, JSON.stringify(err));
	}

	return json({ success: true });
};
