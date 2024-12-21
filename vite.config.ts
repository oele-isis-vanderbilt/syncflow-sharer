import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import * as dotenv from 'dotenv';

/** @type {import('vite').UserConfig} */
export default ({ mode }) => {
	if (mode !== 'production') {
		dotenv.config();
	}
	return defineConfig({
		plugins: [sveltekit()]
	});
};
