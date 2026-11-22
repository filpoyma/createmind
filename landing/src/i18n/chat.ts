import type { TLocale } from './types';

export const chatMessages = {
	ru: {
		leadComplete:
			'Эта заявка уже завершена — мы собрали все данные по текущему проекту. Если у вас новая задача, начните отдельную заявку: история чата обнулится. ТЗ по текущему проекту можно скачать по кнопке «Скачать ТЗ» справа вверху чата.',
		leadCompleteLimit:
			'Эта заявка уже завершена. Вы достигли лимита в 3 проекта. ТЗ по текущему проекту можно скачать по кнопке «Скачать ТЗ» справа вверху чата.',
		projectLimit: 'Достигнут лимит: один пользователь может оформить не более 3 проектов.',
		specDownloadFooter:
			'\n\n—\nСкачать файл можно по кнопке «Скачать ТЗ» справа вверху чата.',
		specGenerating: 'Формирую ТЗ...',
		specFailed: 'Не удалось сформировать ТЗ. Попробуйте ещё раз.',
		specRetryButton: 'Сформировать ТЗ снова',
		restartButton: 'Начать новую заявку',
		restartFailed: 'Не удалось начать новую заявку. Попробуйте ещё раз.',
		replyFailed: 'Не удалось получить ответ. Проверьте соединение и попробуйте ещё раз.',
		aiReplyFailed:
			'Не удалось получить ответ AI. Попробуйте ещё раз через несколько секунд.',
		sendFailed: 'Не удалось отправить сообщение',
	},
	en: {
		leadComplete:
			'This request is already complete — we have collected all details for the current project. For a new task, start a separate request: chat history will reset. You can download the spec for the current project using the "Download spec" button at the top right of the chat.',
		leadCompleteLimit:
			'This request is already complete. You have reached the limit of 3 projects. You can download the spec for the current project using the "Download spec" button at the top right of the chat.',
		projectLimit: 'Limit reached: one user can submit no more than 3 projects.',
		specDownloadFooter:
			'\n\n—\nYou can download the file using the "Download spec" button at the top right of the chat.',
		specGenerating: 'Generating spec...',
		specFailed: 'Failed to generate spec. Please try again.',
		specRetryButton: 'Generate spec again',
		restartButton: 'Start new request',
		restartFailed: 'Failed to start a new request. Please try again.',
		replyFailed: 'Failed to get a response. Check your connection and try again.',
		aiReplyFailed: 'Failed to get an AI response. Please try again in a few seconds.',
		sendFailed: 'Failed to send message',
	},
} as const satisfies Record<TLocale, Record<string, string>>;

export type TChatKey = keyof (typeof chatMessages)['ru'];

export function getChatMessages(locale: TLocale) {
	return chatMessages[locale];
}
