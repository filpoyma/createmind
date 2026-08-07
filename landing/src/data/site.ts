import type { TLocale } from '../i18n/types';

export interface INavLink {
	href: string;
	label: string;
	testId: string;
}

export const navLinks: Record<TLocale, INavLink[]> = {
	ru: [
		{ href: '#use-cases', label: 'Кейсы', testId: 'nav-use-cases' },
		{ href: '#manifesto', label: 'Подход', testId: 'nav-manifesto' },
		{ href: '#process', label: 'Процесс', testId: 'nav-process' },
	],
	en: [
		{ href: '#use-cases', label: 'Use cases', testId: 'nav-use-cases' },
		{ href: '#manifesto', label: 'Approach', testId: 'nav-manifesto' },
		{ href: '#process', label: 'Process', testId: 'nav-process' },
	],
};

export const marqueeItems: Record<TLocale, readonly string[]> = {
	ru: [
		'CREATEMIND',
		'ИИ-АВТОМАТИЗАЦИЯ',
		'БЕЗ РУЧНОГО ТРУДА',
		'ОКУПАЕМОСТЬ',
		'24/7',
	],
	en: [
		'CREATEMIND',
		'AI AUTOMATION',
		'NO MANUAL LABOR',
		'ROI',
		'24/7',
	],
};

export const contacts = {
	telegram: 'https://t.me/andrey_dobrosvet',
	telegramHandle: '@createmind',
	whatsapp: 'https://wa.me/79998508849',
	email: 'hello@createmind.org',
} as const;
