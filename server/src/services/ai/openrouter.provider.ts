import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import logger from '../../config/logger';
import { openRouterConfig } from '../../config/openrouter';

export type TProviderMessage = {
	role: 'user' | 'assistant' | 'developer';
	content: string;
};

export type TAiProviderErrorCode =
	| 'refusal'
	| 'incomplete'
	| 'parse_error'
	| 'api_error'
	| 'not_configured';

export class AiProviderError extends Error {
	readonly statusCode: number;
	readonly code: TAiProviderErrorCode;

	constructor(message: string, code: TAiProviderErrorCode, statusCode = 502) {
		super(message);
		this.name = 'AiProviderError';
		this.code = code;
		this.statusCode = statusCode;
	}
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
	if (!openRouterConfig.apiKey) {
		throw new AiProviderError(
			'OpenRouter API key is not configured',
			'not_configured',
			503,
		);
	}

	if (!client) {
		client = new OpenAI({
			apiKey: openRouterConfig.apiKey,
			baseURL: openRouterConfig.baseUrl,
			defaultHeaders: {
				'HTTP-Referer': openRouterConfig.httpReferer,
				'X-Title': openRouterConfig.appName,
			},
		});
	}

	return client;
}

function toChatMessages(
	instructions: string,
	input: TProviderMessage[],
): ChatCompletionMessageParam[] {
	const messages: ChatCompletionMessageParam[] = [
		{ role: 'system', content: instructions },
	];

	for (const message of input) {
		if (message.role === 'developer') {
			messages.push({ role: 'system', content: message.content });
			continue;
		}
		messages.push({ role: message.role, content: message.content });
	}

	return messages;
}

export async function createStructuredResponse<T>(params: {
	instructions: string;
	input: TProviderMessage[];
	schemaName: string;
	schema: Record<string, unknown>;
	maxOutputTokens: number;
}): Promise<T> {
	const openRouter = getClient();

	try {
		const response = await openRouter.chat.completions.create({
			model: openRouterConfig.model,
			messages: toChatMessages(params.instructions, params.input),
			max_tokens: params.maxOutputTokens,
			response_format: {
				type: 'json_schema',
				json_schema: {
					name: params.schemaName,
					strict: true,
					schema: params.schema,
				},
			},
		});

		const choice = response.choices[0];
		const message = choice?.message;

		if (message?.refusal) {
			throw new AiProviderError(message.refusal, 'refusal');
		}

		if (choice?.finish_reason === 'length') {
			throw new AiProviderError(
				'OpenRouter response truncated (max tokens)',
				'incomplete',
			);
		}

		const content = message?.content?.trim();
		if (!content) {
			throw new AiProviderError('OpenRouter returned empty output', 'parse_error');
		}

		try {
			return JSON.parse(content) as T;
		} catch {
			throw new AiProviderError('Failed to parse OpenRouter JSON output', 'parse_error');
		}
	} catch (error) {
		if (error instanceof AiProviderError) throw error;

		logger.error('OpenRouter API error', error);
		throw new AiProviderError(
			error instanceof Error ? error.message : 'OpenRouter request failed',
			'api_error',
		);
	}
}