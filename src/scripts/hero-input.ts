import { getCurrentLang } from '../lib/lang';
import { openModal } from './modal';

function showToast(message: string): void {
	let toast = document.getElementById('app-toast');
	if (!toast) {
		toast = document.createElement('div');
		toast.id = 'app-toast';
		toast.className = 'toast hidden';
		document.body.appendChild(toast);
	}

	toast.textContent = message;
	toast.classList.remove('hidden');

	clearTimeout((toast as HTMLElement & { _hideTimer?: number })._hideTimer);
	(toast as HTMLElement & { _hideTimer?: number })._hideTimer = window.setTimeout(
		() => toast?.classList.add('hidden'),
		2800,
	);
}

export function initHeroInput(): void {
	const heroInput = document.getElementById('hero-input-field');
	const heroSend = document.getElementById('hero-send-btn');
	const heroVoice = document.getElementById('hero-voice-btn');

	if (!heroInput) return;

	function handleHeroSend(): void {
		const text = heroInput instanceof HTMLInputElement ? heroInput.value.trim() : '';
		const lang = getCurrentLang();

		if (!text) {
			showToast(
				lang === 'en' ? 'Please describe your task first.' : 'Сначала опишите вашу задачу.',
			);
			return;
		}

		openModal(text);
		if (heroInput instanceof HTMLInputElement) heroInput.value = '';

		if (typeof window.setHeroState === 'function') {
			window.setHeroState('INPUT_FOCUS');
		}
	}

	if (heroSend) heroSend.addEventListener('click', handleHeroSend);

	if (heroInput instanceof HTMLInputElement) {
		heroInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') handleHeroSend();
		});

		heroInput.addEventListener('focus', () => {
			if (typeof window.setHeroState === 'function') {
				window.setHeroState('INPUT_FOCUS');
			}
		});

		heroInput.addEventListener('blur', () => {
			if (typeof window.setHeroState === 'function') {
				window.setHeroState('AMBIENT');
			}
		});
	}

	let recognition: SpeechRecognition | null = null;
	let isRecording = false;

	if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
		const SpeechRecognitionCtor =
			window.SpeechRecognition || window.webkitSpeechRecognition;
		recognition = new SpeechRecognitionCtor();
		recognition.continuous = false;
		recognition.interimResults = false;

		const updateRecognitionLang = () => {
			if (recognition) {
				recognition.lang = getCurrentLang() === 'en' ? 'en-US' : 'ru-RU';
			}
		};

		updateRecognitionLang();
		document.addEventListener('langchange', updateRecognitionLang);

		recognition.onstart = () => {
			isRecording = true;
			if (heroVoice) heroVoice.classList.add('recording');
			if (heroInput instanceof HTMLInputElement) {
				heroInput.placeholder =
					getCurrentLang() === 'en' ? 'Listening... Speak' : 'Слушаю вас... Говорите';
			}
		};

		recognition.onresult = (event: SpeechRecognitionEvent) => {
			const resultText = event.results[0][0].transcript;
			if (heroInput instanceof HTMLInputElement) {
				heroInput.value = resultText;
				handleHeroSend();
			}
			showToast(
				getCurrentLang() === 'en'
					? 'Speech recognized successfully!'
					: 'Речь успешно распознана!',
			);
		};

		recognition.onerror = () => {
			showToast(
				getCurrentLang() === 'en'
					? 'Speech recognition error.'
					: 'Ошибка распознавания речи.',
			);
			stopRecording();
		};

		recognition.onend = () => stopRecording();
	}

	function stopRecording(): void {
		isRecording = false;
		if (heroVoice) heroVoice.classList.remove('recording');
		if (heroInput instanceof HTMLInputElement) {
			const lang = getCurrentLang();
			heroInput.placeholder =
				lang === 'en' ? 'Describe your task...' : 'Опишите вашу задачу...';
		}
	}

	if (heroVoice) {
		heroVoice.addEventListener('click', () => {
			if (!recognition) {
				showToast(
					getCurrentLang() === 'en'
						? 'Voice input is not supported by your browser.'
						: 'Голосовой ввод не поддерживается вашим браузером.',
				);
				return;
			}

			if (isRecording) recognition.stop();
			else recognition.start();
		});
	}
}
