import { contacts } from '../data/site';

export const SITE_URL = 'https://createmind.org';

export const DEFAULT_TITLE = 'CreateMind — AI-автоматизация для бизнеса';

export const DEFAULT_DESCRIPTION =
	'Автоматизируем процессы в вашем бизнесе с помощью искусственного интеллекта. AI-помощники, автоматизация продаж, документооборот, клиентский сервис.';

export const OG_IMAGE = '/images/og-image.jpg';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export const THEME_COLOR = '#10b981';

export function absoluteUrl(path: string): string {
	return new URL(path, SITE_URL).href;
}

export function buildJsonLd(description: string) {
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'Organization',
				'@id': `${SITE_URL}/#organization`,
				name: 'CreateMind',
				url: SITE_URL,
				logo: absoluteUrl('/favicon.svg'),
				email: contacts.email,
				sameAs: [contacts.telegram, contacts.whatsapp],
			},
			{
				'@type': 'WebSite',
				'@id': `${SITE_URL}/#website`,
				url: SITE_URL,
				name: 'CreateMind',
				description,
				inLanguage: 'ru-RU',
				publisher: { '@id': `${SITE_URL}/#organization` },
			},
			{
				'@type': 'ProfessionalService',
				'@id': `${SITE_URL}/#service`,
				name: DEFAULT_TITLE,
				url: SITE_URL,
				description,
				areaServed: {
					'@type': 'Country',
					name: 'Russia',
				},
				serviceType: [
					'AI-автоматизация',
					'Внедрение искусственного интеллекта',
					'Автоматизация бизнес-процессов',
				],
				provider: { '@id': `${SITE_URL}/#organization` },
			},
		],
	};
}
