import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import * as dotenv from 'dotenv';
import adapter from '@sveltejs/adapter-node';

/** @type {import('vite').UserConfig} */
export default ({ mode }) => {
	if (mode !== 'production') {
		dotenv.config();
	}
	return defineConfig({
		plugins: [
			tailwindcss(),
			sveltekit({
				alias: {
					$lib: 'src/lib'
				},
				adapter: adapter()
			})
		]
	});
};
