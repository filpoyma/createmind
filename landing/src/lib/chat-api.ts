import { getApiUrl } from './api';
import {
	getOrCreateChatId,
	getDeviceFingerprint,
	setChatId,
} from './visitor';

export type TChatRole = 'user' | 'assistant';

export interface IChatMessage {
	role: TChatRole;
	text: string;
	createdAt: string;
}

export interface IChatSession {
	chatId: string;
	messages: IChatMessage[];
	restored: boolean;
}

interface IApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
}

async function buildVisitorHeaders(): Promise<Record<string, string>> {
	const chatId = getOrCreateChatId();
	const fingerprint = await getDeviceFingerprint();

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'X-Chat-Id': chatId,
	};

	if (fingerprint) {
		headers['X-Device-Fp'] = fingerprint;
	}

	return headers;
}

function parseSession(payload: IApiResponse<IChatSession>): IChatSession | null {
	if (!payload.success || !payload.data) return null;

	if (payload.data.chatId) {
		setChatId(payload.data.chatId);
	}

	return payload.data;
}

export async function resolveChatSession(): Promise<IChatSession | null> {
	const chatId = getOrCreateChatId();
	const apiUrl = getApiUrl();

	try {
		const headers = await buildVisitorHeaders();

		const getResponse = await fetch(`${apiUrl}/chat/sessions/${chatId}`, {
			headers,
			signal: AbortSignal.timeout(8000),
		});

		if (getResponse.ok) {
			const payload = (await getResponse.json()) as IApiResponse<IChatSession>;
			return parseSession(payload);
		}

		if (getResponse.status !== 404) {
			return null;
		}

		const fingerprint = await getDeviceFingerprint();
		const postResponse = await fetch(`${apiUrl}/chat/sessions`, {
			method: 'POST',
			headers,
			body: JSON.stringify({ chatId, fingerprint }),
			signal: AbortSignal.timeout(8000),
		});

		if (!postResponse.ok) return null;

		const payload = (await postResponse.json()) as IApiResponse<IChatSession>;
		return parseSession(payload);
	} catch {
		return null;
	}
}

export async function sendChatMessage(
	role: TChatRole,
	text: string,
): Promise<IChatMessage[] | null> {
	const chatId = getOrCreateChatId();
	const apiUrl = getApiUrl();

	try {
		const headers = await buildVisitorHeaders();
		const response = await fetch(`${apiUrl}/chat/sessions/${chatId}/messages`, {
			method: 'POST',
			headers,
			body: JSON.stringify({ role, text }),
			signal: AbortSignal.timeout(8000),
		});

		if (!response.ok) return null;

		const payload = (await response.json()) as IApiResponse<{ messages: IChatMessage[] }>;
		if (!payload.success || !payload.data?.messages) return null;

		return payload.data.messages;
	} catch {
		return null;
	}
}
