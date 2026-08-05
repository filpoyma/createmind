const groqApiKey = process.env.GROQ_API_KEY;
const groqBaseUrl = 'https://api.groq.com/openai/v1';

export const groqConfig = {
	apiKey: groqApiKey ?? '',
	baseUrl: groqBaseUrl,
	transcriptionModel: 'whisper-large-v3-turbo',
} as const;

export const isGroqConfigured = Boolean(groqApiKey);
