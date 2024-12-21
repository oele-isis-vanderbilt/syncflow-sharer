class SyncFlowSettings {
	enabled: boolean;
	enableAudio: boolean;
	enableCamera: boolean;
	enableScreenShare: boolean;
	recordSession: boolean;
	sessionName: string | null;

	constructor() {
		this.enabled = true;
		this.enableAudio = true;
		this.enableCamera = false;
		this.enableScreenShare = true;
		this.sessionName = null;
		this.recordSession = true;
	}

	setEnabled(enabled: boolean) {
		this.enabled = enabled;
	}

	setEnableAudio(enableAudio: boolean) {
		this.enableAudio = enableAudio;
	}

	setEnableCamera(enableCamera: boolean) {
		this.enableCamera = enableCamera;
	}

	setEnableScreenShare(enableScreenShare: boolean) {
		this.enableScreenShare = enableScreenShare;
	}

	setRecordSession(recordSession: boolean) {
		this.recordSession = recordSession;
	}

	setSessionName(sessionName: string) {
		this.sessionName = sessionName;
	}

	isEnabled() {
		return this.enabled;
	}

	isAudioEnabled() {
		return this.enableAudio;
	}

	isCameraEnabled() {
		return this.enableCamera;
	}

	isScreenShareEnabled() {
		return this.enableScreenShare;
	}

	isSessionRecorded() {
		return this.recordSession;
	}

	getSessionName() {
		return this.sessionName;
	}

	toJSON() {
		return {
			enabled: this.enabled,
			enableAudio: this.enableAudio,
			enableCamera: this.enableCamera,
			enableScreenShare: this.enableScreenShare,
			sessionName: this.sessionName,
			recordSession: this.recordSession
		};
	}
}

export let syncFlowSettings = new SyncFlowSettings();
