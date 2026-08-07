import type { TLocale } from '../../types/locale.types';

export const MAX_MESSAGE_WORDS = 80;
export const MAX_MESSAGE_CHARS = 500;

const SHORTEN_RETRY_RU =
	'Перепиши ответ короче 80 слов. Оставь только краткое понимание и один следующий вопрос.';

const SHORTEN_RETRY_EN =
	'Rewrite the reply under 80 words. Keep only a brief summary and one follow-up question.';

export function getShortenRetryInstruction(locale: TLocale): string {
	return locale === 'en' ? SHORTEN_RETRY_EN : SHORTEN_RETRY_RU;
}

/** @deprecated Use getShortenRetryInstruction('ru') */
export const SHORTEN_RETRY_INSTRUCTION = SHORTEN_RETRY_RU;

export function countWords(text: string): number {
	const trimmed = text.trim();
	if (!trimmed) return 0;
	return trimmed.split(/\s+/).length;
}

export function isTooLong(text: string): boolean {
	return countWords(text) > MAX_MESSAGE_WORDS || text.length > MAX_MESSAGE_CHARS;
}

export function limitText(text: string, maxLength = MAX_MESSAGE_CHARS): string {
	if (text.length <= maxLength) return text;

	const head = text.slice(0, maxLength);
	const sentenceEnd = Math.max(
		head.lastIndexOf('. '),
		head.lastIndexOf('? '),
		head.lastIndexOf('! '),
	);

	if (sentenceEnd > maxLength * 0.5) {
		return head.slice(0, sentenceEnd + 1).trim();
	}

	const lastSpace = head.lastIndexOf(' ');
	if (lastSpace <= 0) return `${head.trim()}…`;

	return `${head.slice(0, lastSpace).trim()}…`;
}
