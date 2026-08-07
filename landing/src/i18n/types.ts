export type TLocale = 'ru' | 'en';

export const LOCALES: TLocale[] = ['ru', 'en'];

export function isLocale(value: string): value is TLocale {
	return value === 'ru' || value === 'en';
}
