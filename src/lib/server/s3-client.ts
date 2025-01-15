import * as Minio from 'minio';

let minioClient: Minio.Client | null = null;

export const getMinioClient = () => {
	if (!minioClient) {
		minioClient = new Minio.Client({
			endPoint: process.env.S3_ENDPOINT!,
			port: parseInt(process.env.S3_PORT!),
			useSSL: process.env.S3_USE_SSL === 'true',
			accessKey: process.env.S3_ACCESS_KEY,
			secretKey: process.env.S3_SECRET_KEY
		});
	}

	return minioClient;
};
