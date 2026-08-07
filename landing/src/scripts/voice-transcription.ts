const AUDIO_FILE_NAME = 'voice-input.webm';

const VOICE_ERRORS = {
	tooShort: 'Запись слишком короткая. Попробуйте ещё раз.',
	transcribeFailed: 'Не удалось расшифровать аудио. Попробуйте ещё раз.',
	browserNoAudio: 'Ваш браузер не поддерживает запись аудио.',
	browserNoMediaRecorder: 'Ваш браузер не поддерживает MediaRecorder.',
	recordingFailed: 'Ошибка записи. Попробуйте ещё раз.',
	noMicAccess: 'Нет доступа к микрофону. Разрешите доступ в настройках браузера.',
} as const;

interface ITranscriptionApiResponse {
	success: boolean;
	data?: {
		text?: string;
	};
	message?: string;
}

interface IVoiceTranscriptionOptions {
	input: HTMLInputElement;
	micButton: HTMLButtonElement;
	status?: HTMLElement | null;
	language?: 'ru' | 'en';
	apiUrl?: string;
}

function pickSupportedMimeType(): string {
	if (typeof MediaRecorder === 'undefined') return '';
	const candidates = ['audio/webm;codecs=opus', 'audio/webm'];
	return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
}

import { getApiUrl } from '../lib/api';

async function transcribeAudio(formData: FormData, apiUrl: string): Promise<string> {
	const response = await fetch(`${apiUrl}/transcriptions`, {
		method: 'POST',
		body: formData,
		signal: AbortSignal.timeout(10000),
	});

	const payload = (await response.json()) as ITranscriptionApiResponse;

	if (!response.ok || !payload.success || !payload.data?.text) {
		throw new Error(payload.message || VOICE_ERRORS.transcribeFailed);
	}

	return payload.data.text;
}

export function initHeroVoiceInput({
	input,
	micButton,
	status,
	language = 'ru',
	apiUrl = getApiUrl(),
}: IVoiceTranscriptionOptions): void {
	const supportedMimeType = pickSupportedMimeType();
	let recording = false;
	let isTranscribing = false;
	let mediaRecorder: MediaRecorder | null = null;
	let stream: MediaStream | null = null;
	let audioChunks: BlobPart[] = [];
	let lastTranscription = '';

	const setStatus = (message: string, isError = false) => {
		if (!status) return;
		status.textContent = message;
		status.classList.toggle('text-red-600', isError);
		status.classList.toggle('text-zinc-500', !isError);
		status.classList.remove('hidden');
	};

	const clearStatus = () => {
		if (!status) return;
		status.textContent = '';
		status.classList.add('hidden');
	};

	const clearError = () => {
		if (!status?.classList.contains('text-red-600')) return;
		clearStatus();
	};

	const reportError = (message: string) => {
		setStatus(message, true);
	};

	const releaseStream = () => {
		stream?.getTracks().forEach((track) => track.stop());
		stream = null;
	};

	const updateMicUi = () => {
		micButton.disabled = isTranscribing;
		micButton.setAttribute('aria-pressed', recording ? 'true' : 'false');
		micButton.setAttribute('aria-busy', isTranscribing ? 'true' : 'false');
		micButton.dataset.recording = recording ? 'true' : 'false';
		micButton.dataset.transcribing = isTranscribing ? 'true' : 'false';
	};

	const appendTranscript = (text: string) => {
		const current = input.value.trim();
		input.value = current ? `${current} ${text}` : text;
		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.focus();
	};

	const transcribeBlob = async (audioBlob: Blob) => {
		if (audioBlob.size === 0) {
			reportError(VOICE_ERRORS.tooShort);
			return;
		}

		const formData = new FormData();
		formData.append('audio', audioBlob, AUDIO_FILE_NAME);
		if (language) formData.append('language', language);

		isTranscribing = true;
		updateMicUi();
		setStatus('Расшифровка...');

		try {
			const text = await transcribeAudio(formData, apiUrl);
			const normalized = text.trim();
			if (!normalized || normalized === lastTranscription) {
				clearStatus();
				return;
			}
			lastTranscription = normalized;
			appendTranscript(normalized);
			clearStatus();
		} catch (error) {
			reportError(error instanceof Error ? error.message : VOICE_ERRORS.transcribeFailed);
		} finally {
			isTranscribing = false;
			updateMicUi();
		}
	};

	const stopRecording = () => {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
		} else {
			releaseStream();
		}
		mediaRecorder = null;
		recording = false;
		updateMicUi();
	};

	const startRecording = async () => {
		clearStatus();

		if (!navigator.mediaDevices?.getUserMedia) {
			reportError(VOICE_ERRORS.browserNoAudio);
			return;
		}
		if (typeof MediaRecorder === 'undefined') {
			reportError(VOICE_ERRORS.browserNoMediaRecorder);
			return;
		}

		recording = true;
		updateMicUi();
		setStatus('Подключение к микрофону...');

		try {
			stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			audioChunks = [];

			let recorder: MediaRecorder;
			try {
				recorder = supportedMimeType
					? new MediaRecorder(stream, { mimeType: supportedMimeType })
					: new MediaRecorder(stream);
			} catch {
				recorder = new MediaRecorder(stream);
			}
			mediaRecorder = recorder;

			recorder.ondataavailable = (event) => {
				if (event.data.size > 0) audioChunks.push(event.data);
			};

			recorder.onerror = () => {
				recording = false;
				reportError(VOICE_ERRORS.recordingFailed);
				releaseStream();
				updateMicUi();
			};

			recorder.onstop = () => {
				const audioBlob = new Blob(audioChunks, {
					type: recorder.mimeType || 'audio/webm',
				});
				audioChunks = [];
				releaseStream();
				void transcribeBlob(audioBlob);
			};

			recorder.start(250);
			setStatus('Идёт запись... Нажмите микрофон, чтобы остановить.');
		} catch {
			reportError(VOICE_ERRORS.noMicAccess);
			recording = false;
			releaseStream();
			updateMicUi();
		}
	};

	micButton.addEventListener('click', () => {
		if (isTranscribing) return;
		if (recording) {
			stopRecording();
		} else {
			void startRecording();
		}
	});

	input.addEventListener('input', clearError);
	input.addEventListener('focus', clearError);

	const submitButton = document.getElementById('hero-submit');
	submitButton?.addEventListener('click', clearError);
	input.addEventListener('keydown', (event) => {
		if (event.key === 'Enter') clearError();
	});

	window.addEventListener('beforeunload', () => {
		releaseStream();
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
		}
	});
}
