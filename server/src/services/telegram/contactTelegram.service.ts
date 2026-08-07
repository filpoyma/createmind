import type { TLocale } from '../../types/locale.types';
import { sendTelegramText } from './telegram.client';

export interface IContactFormPayload {
	name: string;
	phone: string;
	task: string;
	locale: TLocale;
}

function buildContactMessage(payload: IContactFormPayload): string {
	const isEn = payload.locale === 'en';

	if (isEn) {
		return [
			'CreateMind: New request from website',
			'',
			`Name: ${payload.name}`,
			`Contact: ${payload.phone}`,
			`Task: ${payload.task}`,
			`Language: ${payload.locale}`,
		].join('\n');
	}

	return [
		'CreateMind: Новая заявка с сайта',
		'',
		`Имя: ${payload.name}`,
		`Контакт: ${payload.phone}`,
		`Задача: ${payload.task}`,
		`Язык: ${payload.locale}`,
	].join('\n');
}

export async function sendContactFormTelegram(payload: IContactFormPayload): Promise<boolean> {
	const message = buildContactMessage(payload);
	return sendTelegramText(message, `contact form from ${payload.name}`);
}
