import FingerprintJS from '@fingerprintjs/fingerprintjs';

const CHAT_ID_KEY = 'createmind-chat-id';

let fpAgentPromise: ReturnType<typeof FingerprintJS.load> | null = null;

function loadFingerprintAgent() {
	if (!fpAgentPromise) {
		fpAgentPromise = FingerprintJS.load({ monitoring: false });
	}
	return fpAgentPromise;
}

export function getOrCreateChatId(): string {
	let id = localStorage.getItem(CHAT_ID_KEY);
	if (!id) {
		id = crypto.randomUUID();
		localStorage.setItem(CHAT_ID_KEY, id);
	}
	return id;
}

export function setChatId(chatId: string): void {
	localStorage.setItem(CHAT_ID_KEY, chatId);
}

export async function getDeviceFingerprint(): Promise<string | null> {
	try {
		const agent = await loadFingerprintAgent();
		const result = await agent.get();
		return result.visitorId;
	} catch {
		return null;
	}
}

export function initVisitorSession(): void {
	getOrCreateChatId();
	void loadFingerprintAgent();
}
