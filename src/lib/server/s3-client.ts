import * as Minio from 'minio';

let minioClient: Minio.Client | null = null;

export const getMinioClient = () => {
	if (!minioClient) {
		minioClient = new Minio.Client({
			endPoint: process.env.MINIO_ENDPOINT!,
			port: parseInt(process.env.MINIO_PORT!),
			useSSL: process.env.MINIO_USE_SSL === 'true',
			accessKey: process.env.MINIO_ACCESS_KEY,
			secretKey: process.env.MINIO_SECRET_KEY
		});
	}

	return minioClient;
};
