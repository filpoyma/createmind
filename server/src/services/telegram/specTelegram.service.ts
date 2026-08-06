import logger, { logError } from '../../config/logger';
import { isTelegramConfigured, telegramConfig } from '../../config/telegram';
import type { IProjectBriefDoc } from '../../models/chatSession.model';

const TELEGRAM_MESSAGE_MAX_LENGTH = 4000;

function buildSpecMessage(params: {
	chatId: string;
	specText: string;
	brief: Pick<IProjectBriefDoc, 'taskSummary' | 'projectType' | 'contact'>;
	title?: string;
}): string {
	const subjectTitle =
		params.title?.trim() || params.brief.taskSummary?.trim() || 'Новая заявка';

	const meta = [
		`CreateMind: ${subjectTitle}`,
		`Chat ID: ${params.chatId}`,
		`Тип проекта: ${params.brief.projectType ?? '—'}`,
		`Контакт: ${params.brief.contact ?? '—'}`,
		'',
		'---',
		'',
	].join('\n');

	return `${meta}${params.specText}`;
}

function splitTelegramMessage(text: string): string[] {
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

export async function sendProjectSpecTelegram(params: {
	chatId: string;
	specText: string;
	brief: Pick<IProjectBriefDoc, 'taskSummary' | 'projectType' | 'contact'>;
	title?: string;
}): Promise<boolean> {
	if (!isTelegramConfigured) {
		logger.warn('Telegram is not configured — spec message was not sent');
		return false;
	}

	const message = buildSpecMessage(params);
	const chunks = splitTelegramMessage(message);

	try {
		for (const chunk of chunks) {
			const sent = await sendTelegramMessage(chunk);
			if (!sent) {
				return false;
			}
		}

		logger.info(
			`Project spec Telegram message sent to chat ${telegramConfig.chatId} for chat ${params.chatId}`,
		);
		return true;
	} catch (error) {
		logError('Failed to send project spec via Telegram', error);
		return false;
	}
}
