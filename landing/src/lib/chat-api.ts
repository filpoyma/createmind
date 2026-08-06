import { getApiUrl } from './api';
import {
	getOrCreateChatId,
	getDeviceFingerprint,
	setChatId,
} from './visitor';

export type TChatRole = 'user' | 'assistant';
export type TInterviewStage = 'discovery' | 'confirmation' | 'contact' | 'completed';

export interface IChatMessage {
	role: TChatRole;
	text: string;
	createdAt: string;
}

export interface IProjectBrief {
	taskSummary?: string;
	expectedResult?: string;
	projectType?: string;
	contact?: string;
	understandingConfirmed: boolean;
	leadComplete: boolean;
	stage: TInterviewStage;
}

export interface IChatSession {
	chatId: string;
	messages: IChatMessage[];
	brief: IProjectBrief;
	leadComplete: boolean;
	canGenerateSpec: boolean;
	hasSpec: boolean;
	canStartNewProject: boolean;
	restored: boolean;
}

export interface ISpecResult {
	text: string;
	json: Record<string, unknown>;
	generatedAt: string;
}

interface IApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
	code?: string;
	canStartNewProject?: boolean;
}

export class ChatApiError extends Error {
	readonly code?: string;
	readonly canStartNewProject?: boolean;

	constructor(
		message: string,
		code?: string,
		options?: { canStartNewProject?: boolean },
	) {
		super(message);
		this.name = 'ChatApiError';
		this.code = code;
		this.canStartNewProject = options?.canStartNewProject;
	}
}

const AI_REQUEST_TIMEOUT_MS = 60000;

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

export async function sendChatMessage(text: string): Promise<IChatSession | null> {
	const chatId = getOrCreateChatId();
	const apiUrl = getApiUrl();

	try {
		const headers = await buildVisitorHeaders();
		const response = await fetch(`${apiUrl}/chat/sessions/${chatId}/messages`, {
			method: 'POST',
			headers,
			body: JSON.stringify({ text }),
			signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
		});

		const payload = (await response.json()) as IApiResponse<IChatSession>;

		if (!response.ok || !payload.success || !payload.data) {
			throw new ChatApiError(
				payload.message || 'Не удалось отправить сообщение',
				payload.code,
				{ canStartNewProject: payload.canStartNewProject },
			);
		}

		return parseSession(payload);
	} catch (error) {
		if (error instanceof ChatApiError) throw error;
		throw new ChatApiError('Не удалось отправить сообщение');
	}
}

export async function restartChatSession(): Promise<IChatSession> {
	const chatId = getOrCreateChatId();
	const apiUrl = getApiUrl();

	const headers = await buildVisitorHeaders();
	const response = await fetch(`${apiUrl}/chat/sessions/${chatId}/restart`, {
		method: 'POST',
		headers,
		signal: AbortSignal.timeout(8000),
	});

	const payload = (await response.json()) as IApiResponse<IChatSession>;

	if (!response.ok || !payload.success || !payload.data) {
		throw new ChatApiError(
			payload.message || 'Не удалось начать новую заявку',
			payload.code,
		);
	}

	const session = parseSession(payload);
	if (!session) {
		throw new ChatApiError('Не удалось начать новую заявку');
	}

	return session;
}

export async function generateSpec(): Promise<ISpecResult> {
	const chatId = getOrCreateChatId();
	const apiUrl = getApiUrl();

	const headers = await buildVisitorHeaders();
	const response = await fetch(`${apiUrl}/chat/sessions/${chatId}/spec`, {
		method: 'POST',
		headers,
		signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
	});

	const payload = (await response.json()) as IApiResponse<ISpecResult>;

	if (!response.ok || !payload.success || !payload.data) {
		throw new Error(payload.message || 'Не удалось сформировать ТЗ');
	}

	return payload.data;
}

export function downloadSpec(text: string, json: Record<string, unknown>, chatId: string) {
	const textBlob = new Blob([text], { type: 'text/plain;charset=utf-8' });
	const jsonBlob = new Blob([JSON.stringify(json, null, 2)], {
		type: 'application/json;charset=utf-8',
	});

	const textUrl = URL.createObjectURL(textBlob);
	const jsonUrl = URL.createObjectURL(jsonBlob);

	const textLink = document.createElement('a');
	textLink.href = textUrl;
	textLink.download = `createmind-spec-${chatId}.txt`;
	textLink.click();

	const jsonLink = document.createElement('a');
	jsonLink.href = jsonUrl;
	jsonLink.download = `createmind-spec-${chatId}.json`;
	jsonLink.click();

	URL.revokeObjectURL(textUrl);
	URL.revokeObjectURL(jsonUrl);
}
