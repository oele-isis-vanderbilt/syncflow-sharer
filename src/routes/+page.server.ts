import { getProjectClient } from '$lib/server/syncflow-client';
import { syncFlowSettings } from '$lib/server/settings';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const sessionResult = await getProjectClient().getSessions();
	try {
		const sessions = sessionResult.unwrap();
		return {
			sessions: sessions,
			settings: syncFlowSettings.toJSON(),
			error: null
		};
	} catch (error) {
		return {
			sessions: null,
			error: JSON.stringify(error)
		};
	}
};

export const actions = {
	generateSessionToken: async ({ request }) => {
		const data = await request.formData();
		const identity = data.get('identity') as string;
		const sessionId = data.get('sessionId') as string;
		const session = (await getProjectClient().getSession(sessionId)).map((s) => s.name).unwrap();
		const tokenResult = await getProjectClient().generateSessionToken(sessionId, {
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
				room: session,
				roomAdmin: true,
				roomCreate: true,
				roomJoin: true,
				roomList: true,
				roomRecord: true
			}
		});

		try {
			const token = tokenResult.unwrap();
			return {
				token: token,
				success: true
			};
		} catch (error) {
			return fail(500, {
				syncFlowError: JSON.stringify(error)
			});
		}
	}
} satisfies Actions;
