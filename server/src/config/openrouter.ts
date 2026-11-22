const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const openRouterBaseUrl =
	process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1';
const openRouterModel =
	process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini';

export const openRouterConfig = {
	apiKey: openRouterApiKey ?? '',
	baseUrl: openRouterBaseUrl,
	model: openRouterModel,
	httpReferer:
		process.env.OPENROUTER_HTTP_REFERER ??
		process.env.SITE_URL ??
		'https://createmind.org',
	appName: process.env.OPENROUTER_APP_NAME ?? 'CreateMind',
	interviewMaxOutputTokens: 250,
	specMaxOutputTokens: 2000,
} as const;

export const isOpenRouterConfigured = Boolean(openRouterApiKey);