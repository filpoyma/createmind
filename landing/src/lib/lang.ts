import type { TLocale } from '../i18n/types';

export type TLang = TLocale;

export function getCurrentLang(): TLocale {
	const win = window as Window & { __LOCALE__?: TLocale };
	return win.__LOCALE__ ?? 'ru';
}

declare global {
	interface Window {
		__LOCALE__?: TLocale;
		currentLang?: TLocale;
		currentHeroState?: string;
		setHeroState?: (state: string) => void;
		showRobotSpeech?: (type: string) => void;
		triggerBusinessPulse?: () => void;
		startCanvasLoop?: () => void;
		stopCanvasLoop?: () => void;
		startDecorativeTimers?: () => void;
		stopDecorativeTimers?: () => void;
		isCanvasRunning?: boolean;
		cinematicStep?: number;
		ambientSpeedFactor?: number;
		cinematicTimeouts?: ReturnType<typeof setTimeout>[];
	}
}
