export type TLocale = 'ru' | 'en';

export function parseLocale(value: string | undefined): TLocale {
	return value === 'en' ? 'en' : 'ru';
}

export function getSessionLocale(session: { locale?: TLocale }): TLocale {
	return session.locale ?? 'ru';
}
