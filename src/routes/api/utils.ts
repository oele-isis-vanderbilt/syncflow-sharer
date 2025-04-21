export const getJSONCorsHeaders = (): HeadersInit => {
	return process.env.TOKEN_ENDPOINT_ORIGIN
		? {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': process.env.TOKEN_ENDPOINT_ORIGIN
			}
		: { 'Content-Type': 'application/json' };
};
