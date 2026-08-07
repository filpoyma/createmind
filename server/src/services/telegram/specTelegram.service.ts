import type { IProjectBriefDoc } from '../../models/chatSession.model';
import { sendTelegramText } from './telegram.client';

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

export async function sendProjectSpecTelegram(params: {
	chatId: string;
	specText: string;
	brief: Pick<IProjectBriefDoc, 'taskSummary' | 'projectType' | 'contact'>;
	title?: string;
}): Promise<boolean> {
	const message = buildSpecMessage(params);
	return sendTelegramText(message, `project spec for chat ${params.chatId}`);
}
