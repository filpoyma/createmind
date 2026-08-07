import type { TLocale } from './types';

export const voiceMessages = {
	ru: {
		tooShort: 'Запись слишком короткая. Попробуйте ещё раз.',
		transcribeFailed: 'Не удалось расшифровать аудио. Попробуйте ещё раз.',
		browserNoAudio: 'Ваш браузер не поддерживает запись аудио.',
		browserNoMediaRecorder: 'Ваш браузер не поддерживает MediaRecorder.',
		recordingFailed: 'Ошибка записи. Попробуйте ещё раз.',
		noMicAccess: 'Нет доступа к микрофону. Разрешите доступ в настройках браузера.',
		transcribing: 'Расшифровка...',
		connectingMic: 'Подключение к микрофону...',
		recording: 'Идёт запись... Нажмите микрофон, чтобы остановить.',
	},
	en: {
		tooShort: 'Recording is too short. Please try again.',
		transcribeFailed: 'Failed to transcribe audio. Please try again.',
		browserNoAudio: 'Your browser does not support audio recording.',
		browserNoMediaRecorder: 'Your browser does not support MediaRecorder.',
		recordingFailed: 'Recording error. Please try again.',
		noMicAccess: 'Microphone access denied. Allow access in browser settings.',
		transcribing: 'Transcribing...',
		connectingMic: 'Connecting to microphone...',
		recording: 'Recording... Tap the mic to stop.',
	},
} as const satisfies Record<TLocale, Record<string, string>>;

export function getVoiceMessages(locale: TLocale) {
	return voiceMessages[locale];
}
