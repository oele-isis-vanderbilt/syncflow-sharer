export const ssr = false;
export const prerender = false;
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const videoUrl =
		'https://gist.githubusercontent.com/deepakpk009/99fd994da714996b296f11c3c371d5ee/raw/28c4094ae48892efb71d5122c1fd72904088439b/media.json';

	const response = await fetch(videoUrl);
	if (response.ok) {
		const data = await response.json();
		const videoSources = data.categories[0].videos;
		const videos = videoSources.map((video) => {
			return {
				src: video.sources[0],
				title: video.title
			};
		});
		const numberOfRepets = Math.ceil(Math.random() * 100);

		// Replicate the videos array to create a larger dataset
		let allVideos = [];
		for (let i = 0; i < numberOfRepets; i++) {
			allVideos.push(...videos);
		}

		return {
			videos: allVideos
		};
	} else {
		console.error('Failed to fetch videos:', response.statusText);
		return {
			videos: []
		};
	}
};
