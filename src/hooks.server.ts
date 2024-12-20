import type { Handle } from "@sveltejs/kit"
import { redirect } from "@sveltejs/kit";

export const handle: Handle = async ({event, resolve}) => {
    // Check if in settings route
    const sessionId = event.cookies.get('sessionId');

    if (event.route.id === '/settings') {
        if (!sessionId) {
            throw redirect(302, '/login');
        }
    }

    event.locals.user = sessionId ? {
        name: process.env.ROOT_USER,
        sessionId: sessionId
    }: null;

    return resolve(event);
} 