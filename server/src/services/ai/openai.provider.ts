import OpenAI from 'openai';
import logger from '../../config/logger';
import { openAiConfig } from '../../config/openai';

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

let openAiClient: OpenAI | null = null;

function getClient(): OpenAI {
	if (!openAiConfig.apiKey) {
		throw new AiProviderError(
			'OpenAI API key is not configured',
			'not_configured',
			503,
		);
	}

	if (!openAiClient) {
		openAiClient = new OpenAI({ apiKey: openAiConfig.apiKey });
	}

	return openAiClient;
}

function extractRefusal(response: OpenAI.Responses.Response): string | null {
	for (const item of response.output) {
		if (item.type !== 'message') continue;
		for (const part of item.content) {
			if (part.type === 'refusal') return part.refusal;
		}
	}
	return null;
}

export async function createStructuredResponse<T>(params: {
	instructions: string;
	input: TProviderMessage[];
	schemaName: string;
	schema: Record<string, unknown>;
	maxOutputTokens: number;
}): Promise<T> {
	const client = getClient();

	try {
		const response = await client.responses.create({
			model: openAiConfig.model,
			instructions: params.instructions,
			input: params.input,
			max_output_tokens: params.maxOutputTokens,
			reasoning: { effort: 'minimal' },
			text: {
				format: {
					type: 'json_schema',
					name: params.schemaName,
					schema: params.schema,
					strict: true,
				},
				verbosity: 'low',
			},
		});

		if (response.status === 'incomplete') {
			const reason = response.incomplete_details?.reason ?? 'unknown';
			throw new AiProviderError(
				`OpenAI response incomplete: ${reason}`,
				'incomplete',
			);
		}

		const refusal = extractRefusal(response);
		if (refusal) {
			throw new AiProviderError(refusal, 'refusal');
		}

		if (!response.output_text) {
			throw new AiProviderError('OpenAI returned empty output', 'parse_error');
		}

		try {
			return JSON.parse(response.output_text) as T;
		} catch {
			throw new AiProviderError('Failed to parse OpenAI JSON output', 'parse_error');
		}
	} catch (error) {
		if (error instanceof AiProviderError) throw error;

		logger.error('OpenAI API error', error);
		throw new AiProviderError(
			error instanceof Error ? error.message : 'OpenAI request failed',
			'api_error',
		);
	}
}
