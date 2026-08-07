import { ui, type TUiKey } from './ui';
import type { TLocale } from './types';

export type { TLocale } from './types';

export function useTranslations(locale: TLocale) {
	const dict = ui[locale];
	return (key: TUiKey) => dict[key];
}

export function getLocaleFromAstro(locale: string | undefined): TLocale {
	return locale === 'en' ? 'en' : 'ru';
}

export { ui, type TUiKey } from './ui';
export { chatMessages, getChatMessages } from './chat';
export { voiceMessages, getVoiceMessages } from './voice';
export { sphereMessages, getSphereMessages } from './sphere';
