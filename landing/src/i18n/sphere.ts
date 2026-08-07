import type { TLocale } from './types';

export const sphereMessages = {
	ru: {
		defaultSpeech: 'Какая у вас задача для меня?',
		processing: 'Обрабатываю запрос...',
	},
	en: {
		defaultSpeech: 'What is your task for me?',
		processing: 'Processing request...',
	},
} as const satisfies Record<TLocale, { defaultSpeech: string; processing: string }>;

export function getSphereMessages(locale: TLocale) {
	return sphereMessages[locale];
}
