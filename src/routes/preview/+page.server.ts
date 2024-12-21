import type { PageServerLoad } from './$types';
import { getProjectClient } from '$lib/server/syncflow-client';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url }) => {
	const sessionId = url.searchParams.get('sessionId');
	if (!sessionId) {
		return error(400, 'No session ID provided');
	}
	const client = getProjectClient();

	const session = await client.getSession(sessionId);

	return (
		await session.mapAsync(async (s) => {
			if (s.status !== 'Started') {
				return error(400, 'Session not active');
			} else {
				const token = await client.generateSessionToken(sessionId, {
					identity: process.env.ROOT_USER,
					name: process.env.ROOT_USER,
					videoGrants: {
						canPublish: false,
						canPublishData: false,
						canSubscribe: true,
						canUpdateOwnMetadata: false,
						roomAdmin: true,
						roomJoin: true,
						roomList: true,
						roomCreate: true,
						roomRecord: false,
						hidden: true,
						canPublishSources: [],
						ingressAdmin: false,
						recorder: false,
						room: s.name
					}
				});

				return token
					.map((t) => {
						return {
							token: t,
							session: s,
							success: true
						};
					})
					.unwrapOrElse((err) => {
						return error(500, 'Error generating token\n' + JSON.stringify(err));
					});
			}
		})
	).unwrapOrElse((err) => {
		return error(500, 'Error getting session\n' + JSON.stringify(err));
	});
};
