export type TLang = 'ru' | 'en';

const STORAGE_KEY = 'preferred-lang';

function detectBrowserLang(): TLang {
	const languages = navigator.languages || [navigator.language || 'en'];
	const isRussian = languages.some((language) =>
		language.toLowerCase().startsWith('ru'),
	);
	return isRussian ? 'ru' : 'en';
}

export function getStoredLang(): TLang {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'ru' || stored === 'en') return stored;
	return detectBrowserLang();
}

export function getCurrentLang(): TLang {
	return (window.currentLang as TLang | undefined) ?? getStoredLang();
}

export function setCurrentLang(lang: TLang): void {
	window.currentLang = lang;
	localStorage.setItem(STORAGE_KEY, lang);
	document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

declare global {
	interface Window {
		currentLang?: TLang;
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
