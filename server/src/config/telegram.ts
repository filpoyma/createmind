const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

export const telegramConfig = {
	botToken: botToken ?? '',
	chatId: chatId ?? '',
} as const;

export const isTelegramConfigured = Boolean(botToken && chatId);
