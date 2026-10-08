// Client for this app's own /api routes. Components call these functions instead of
// fetch('/api/...') directly (see .claude/rules/frontend.md).

export interface PublishedTrack {
	publicationSid: string;
	deviceId: string;
	deviceName: string;
	kind: 'audio' | 'video';
	/** LiveKit TrackInfo as JSON. */
	trackInfo: unknown;
}

export interface PublicationRecord {
	sessionId: string | null;
	sessionName: string | null;
	identity: string | null;
	screenShare: {
		publicationSid: string;
		trackInfo: unknown;
	};
	audioTracks: PublishedTrack[];
	videoTracks: PublishedTrack[];
}

/** Stores a description of the tracks a sharer published (written to S3 by the server). */
export async function postPublicationRecord(
	record: PublicationRecord,
	fetchFn: typeof fetch = fetch
): Promise<void> {
	await fetchFn('/api/publication_record', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(record)
	});
}
