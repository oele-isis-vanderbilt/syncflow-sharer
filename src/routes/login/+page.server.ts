import type { Actions } from '@sveltejs/kit';
import * as bcrypt from 'bcrypt';
import { fail, redirect } from '@sveltejs/kit';
import { request } from 'http';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/');
	}
};

export const actions = {
	login: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username') as string;
		const password = formData.get('password') as string;

		if (
			username === process.env.ROOT_USER &&
			(await bcrypt.compare(password, process.env.ROOT_PASSWORD!))
		) {
			cookies.set('sessionId', crypto.randomUUID(), {
				path: '/',
				httpOnly: true,
				expires: new Date(Date.now() + 1000 * 60 * 60 * 24)
			});
			throw redirect(303, '/');
		} else {
			return fail(401, {
				incorrect: true,
				message: 'Invalid username or password'
			});
		}
	},
	logout: async ({ cookies, locals }) => {
		cookies.delete('sessionId', { path: '/' });
		delete locals.user;
		return {
			success: true
		};
	}
} satisfies Actions;
