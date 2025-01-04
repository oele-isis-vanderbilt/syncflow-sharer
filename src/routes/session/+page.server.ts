import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const lkUrl = url.searchParams.get('livekitUrl');
	const token = url.searchParams.get('token');
	const sessionName = url.searchParams.get('sessionName');
	const videoDeviceId = url.searchParams.get('videoDeviceId');
	const audioDeviceId = url.searchParams.get('audioDeviceId');
	const screnShareEnabled = url.searchParams.get('screenShareEnabled');
	const identity = url.searchParams.get('identity');
	const videoCodec = url.searchParams.get('videoCodec') || 'h264';

	if (!lkUrl || !token || !sessionName) {
		return error(400, 'Missing required parameters');
	}

	return {
		livekit: {
			serverUrl: lkUrl,
			token: token
		},
		sharingDetails: {
			identity: identity,
			sessionName: sessionName,
			videoDeviceId: videoDeviceId,
			audioDeviceId: audioDeviceId,
			screenShareEnabled: screnShareEnabled,
			videoCodec: videoCodec
		}
	};
};
