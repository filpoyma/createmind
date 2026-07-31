import { getStoredLang, setCurrentLang, type TLang } from '../lib/lang';

function applyDataTranslate(lang: TLang): void {
	document.querySelectorAll('[data-translate]').forEach((el) => {
		const text = el.getAttribute(`data-${lang}`);
		if (text) el.textContent = text;
	});

	document.querySelectorAll('[data-translate-html]').forEach((el) => {
		const html = el.getAttribute(`data-${lang}`);
		if (html) el.innerHTML = html;
	});

	document.querySelectorAll('[data-translate-placeholder]').forEach((el) => {
		const placeholder = el.getAttribute(`data-placeholder-${lang}`);
		if (placeholder && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
			el.placeholder = placeholder;
		}
	});

	const bubbleText = document.getElementById('bubble-text');
	if (bubbleText) {
		bubbleText.textContent =
			lang === 'en'
				? 'What is your task for me?'
				: 'Какая у вас задача для меня?';
	}

	document.querySelectorAll('.lang-btn').forEach((btn) => {
		btn.classList.toggle('active', btn.id === `lang-${lang}`);
	});
}

export function toggleLanguage(lang: TLang): void {
	setCurrentLang(lang);
	applyDataTranslate(lang);
}

export function initI18n(): void {
	const savedLang = getStoredLang();
	setCurrentLang(savedLang);
	applyDataTranslate(savedLang);

	document.querySelectorAll('.lang-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			const lang = btn.getAttribute('data-lang');
			if (lang === 'ru' || lang === 'en') toggleLanguage(lang);
		});
	});
}

// Global for inline onclick compatibility in legacy patterns
(window as Window & { toggleLanguage?: typeof toggleLanguage }).toggleLanguage =
	toggleLanguage;
