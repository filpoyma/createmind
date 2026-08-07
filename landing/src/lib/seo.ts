import { contacts } from '../data/site';
import type { TLocale } from '../i18n/types';

export const SITE_URL = 'https://createmind.org';

export const DEFAULT_TITLE: Record<TLocale, string> = {
	ru: 'CreateMind — AI-автоматизация для бизнеса',
	en: 'CreateMind — AI automation for business',
};

export const DEFAULT_DESCRIPTION: Record<TLocale, string> = {
	ru: 'Автоматизируем процессы в вашем бизнесе с помощью искусственного интеллекта. AI-помощники, автоматизация продаж, документооборот, клиентский сервис.',
	en: 'We automate your business processes with artificial intelligence. AI assistants, sales automation, document workflows, and customer service.',
};

export const OG_LOCALE: Record<TLocale, string> = {
	ru: 'ru_RU',
	en: 'en_US',
};

export const HTML_LANG: Record<TLocale, string> = {
	ru: 'ru',
	en: 'en',
};

export const OG_IMAGE = '/images/og-image.jpg';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export const THEME_COLOR = '#10b981';

export function absoluteUrl(path: string): string {
	return new URL(path, SITE_URL).href;
}

export function buildJsonLd(locale: TLocale, description: string) {
	const isEn = locale === 'en';

	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'Organization',
				'@id': `${SITE_URL}/#organization`,
				name: 'CreateMind',
				url: SITE_URL,
				logo: absoluteUrl('/favicon.png'),
				email: contacts.email,
				sameAs: [contacts.telegram, contacts.whatsapp],
			},
			{
				'@type': 'WebSite',
				'@id': `${SITE_URL}/#website`,
				url: SITE_URL,
				name: 'CreateMind',
				description,
				inLanguage: isEn ? 'en-US' : 'ru-RU',
				publisher: { '@id': `${SITE_URL}/#organization` },
			},
			{
				'@type': 'ProfessionalService',
				'@id': `${SITE_URL}/#service`,
				name: DEFAULT_TITLE[locale],
				url: SITE_URL,
				description,
				areaServed: {
					'@type': 'Country',
					name: isEn ? 'International' : 'Russia',
				},
				serviceType: isEn
					? [
							'AI automation',
							'Artificial intelligence implementation',
							'Business process automation',
						]
					: [
							'AI-автоматизация',
							'Внедрение искусственного интеллекта',
							'Автоматизация бизнес-процессов',
						],
				provider: { '@id': `${SITE_URL}/#organization` },
			},
		],
	};
}
