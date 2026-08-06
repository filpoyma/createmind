const openAiApiKey = process.env.OPEN_AI_KEY;
const openAiModel = process.env.OPENAI_MODEL || 'gpt-5-mini';

export const openAiConfig = {
	apiKey: openAiApiKey ?? '',
	model: openAiModel,
	interviewMaxOutputTokens: 250,
	specMaxOutputTokens: 2000,
} as const;

export const isOpenAiConfigured = Boolean(openAiApiKey);
