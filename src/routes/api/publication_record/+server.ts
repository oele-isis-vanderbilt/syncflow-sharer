import { getMinioClient } from '$lib/server/s3-client';
import { getProjectClient } from '$lib/server/syncflow-client';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const minioClient = getMinioClient();
	const projectClient = getProjectClient();
	try {
		const projectDetails = (await projectClient.getProjectDetails()).unwrap();
		const objectPath = `${projectDetails.name}-${projectDetails.id}/${body.sessionName}/publication-records/${body.identity}/${new Date().toISOString()}/record.json`;
		const jsonBuffer = Buffer.from(JSON.stringify(body), 'utf-8');
		try {
			await minioClient.putObject(
				projectDetails.bucketName,
				objectPath,
				jsonBuffer,
				jsonBuffer.length,
				{
					'Content-Type': 'application/json'
				}
			);
		} catch (error) {
			console.error(error);
		}
	} catch (error) {
		console.error(error);
	}

	return json(body);
};
