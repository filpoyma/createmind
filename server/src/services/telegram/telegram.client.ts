import logger, { logError } from '../../config/logger';
import { isTelegramConfigured, telegramConfig } from '../../config/telegram';

const TELEGRAM_MESSAGE_MAX_LENGTH = 4000;

export function splitTelegramMessage(text: string): string[] {
	if (text.length <= TELEGRAM_MESSAGE_MAX_LENGTH) {
		return [text];
	}

	const chunks: string[] = [];
	for (let i = 0; i < text.length; i += TELEGRAM_MESSAGE_MAX_LENGTH) {
		chunks.push(text.slice(i, i + TELEGRAM_MESSAGE_MAX_LENGTH));
	}

	return chunks;
}

async function sendTelegramMessage(text: string): Promise<boolean> {
	const url = `https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`;

	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: telegramConfig.chatId,
			text,
		}),
	});

	if (!response.ok) {
		const errorBody = await response.text();
		logError('Telegram API returned an error', { status: response.status, body: errorBody });
		return false;
	}

	return true;
}

export async function sendTelegramText(message: string, logContext: string): Promise<boolean> {
	if (!isTelegramConfigured) {
		logger.warn(`Telegram is not configured — ${logContext} was not sent`);
		return false;
	}

	const chunks = splitTelegramMessage(message);

	try {
		for (const chunk of chunks) {
			const sent = await sendTelegramMessage(chunk);
			if (!sent) {
				return false;
			}
		}

		logger.info(`Telegram message sent to chat ${telegramConfig.chatId}: ${logContext}`);
		return true;
	} catch (error) {
		logError(`Failed to send Telegram message: ${logContext}`, error);
		return false;
	}
}
