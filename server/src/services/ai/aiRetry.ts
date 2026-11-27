import logger from '../../config/logger';
import {
	AiProviderError,
	type TAiProviderErrorCode,
} from './openrouter.provider';

export const AI_MAX_ATTEMPTS = 2;
export const AI_RETRY_DELAY_MS = 2000;

const RETRYABLE_AI_ERROR_CODES: ReadonlySet<TAiProviderErrorCode> = new Set([
	'api_error',
	'incomplete',
	'parse_error',
]);

function isRetryableAiError(error: unknown): error is AiProviderError {
	return (
		error instanceof AiProviderError && RETRYABLE_AI_ERROR_CODES.has(error.code)
	);
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryAiOperation<T>(
	operationName: string,
	operation: () => Promise<T>,
): Promise<T> {
	for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt++) {
		try {
			return await operation();
		} catch (error) {
			const canRetry = isRetryableAiError(error) && attempt < AI_MAX_ATTEMPTS;
			if (!canRetry) {
				throw error;
			}

			logger.warn(
				`${operationName} failed (attempt ${attempt}/${AI_MAX_ATTEMPTS}), retrying`,
				{ code: error.code },
			);
			await delay(AI_RETRY_DELAY_MS);
		}
	}

	throw new Error(`${operationName} failed after retries`);
}