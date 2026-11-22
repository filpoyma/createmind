import type { IChatMessage } from '../../models/chatSession.model';
import type {
	IProjectBrief,
	IProjectSpecJson,
} from '../../types/interview.types';
import type { TLocale } from '../../types/locale.types';
import logger from '../../config/logger';
import { openRouterConfig } from '../../config/openrouter';
import {
	AiProviderError,
	createStructuredResponse,
	type TAiProviderErrorCode,
} from './openrouter.provider';
import { getSpecSystemPrompt } from './spec.prompt';
import { specResponseSchema } from './spec.schema';

const SPEC_LABELS = {
	ru: {
		summary: '## Краткое описание',
		goals: '## Цели',
		scope: '## Область работ',
		deliverables: '## Результаты',
		openQuestions: '## Открытые вопросы',
		contact: '## Контакт',
		none: 'Нет',
		user: 'Пользователь',
		assistant: 'Ассистент',
		briefHeader: 'Данные заявки:',
		task: 'Задача',
		expectedResult: 'Ожидаемый результат',
		projectType: 'Тип проекта',
		contactField: 'Контакт',
		dialog: 'Диалог:',
	},
	en: {
		summary: '## Summary',
		goals: '## Goals',
		scope: '## Scope',
		deliverables: '## Deliverables',
		openQuestions: '## Open questions',
		contact: '## Contact',
		none: 'None',
		user: 'User',
		assistant: 'Assistant',
		briefHeader: 'Request data:',
		task: 'Task',
		expectedResult: 'Expected outcome',
		projectType: 'Project type',
		contactField: 'Contact',
		dialog: 'Dialog:',
	},
} as const;

export function renderSpecText(spec: IProjectSpecJson, locale: TLocale = 'ru'): string {
	const labels = SPEC_LABELS[locale];

	const sections = [
		`# ${spec.title}`,
		'',
		labels.summary,
		spec.summary,
		'',
		labels.goals,
		...spec.goals.map((goal) => `- ${goal}`),
		'',
		labels.scope,
		...spec.scope.map((item) => `- ${item}`),
		'',
		labels.deliverables,
		...spec.deliverables.map((item) => `- ${item}`),
		'',
		labels.openQuestions,
		...(spec.open_questions.length
			? spec.open_questions.map((item) => `- ${item}`)
			: [`- ${labels.none}`]),
		'',
		labels.contact,
		spec.contact,
	];

	return sections.join('\n');
}

export async function generateProjectSpec(
	messages: IChatMessage[],
	brief: IProjectBrief,
	locale: TLocale = 'ru',
): Promise<IProjectSpecJson> {
	const labels = SPEC_LABELS[locale];

	const dialog = messages
		.map(
			(message) =>
				`${message.role === 'user' ? labels.user : labels.assistant}: ${message.text}`,
		)
		.join('\n');

	const briefContext = [
		labels.briefHeader,
		`- ${labels.task}: ${brief.taskSummary ?? '—'}`,
		`- ${labels.expectedResult}: ${brief.expectedResult ?? '—'}`,
		`- ${labels.projectType}: ${brief.projectType ?? '—'}`,
		`- ${labels.contactField}: ${brief.contact ?? '—'}`,
		'',
		labels.dialog,
		dialog,
	].join('\n');

	return createStructuredResponse<IProjectSpecJson>({
		instructions: getSpecSystemPrompt(locale),
		input: [{ role: 'user', content: briefContext }],
		schemaName: 'project_spec',
		schema: specResponseSchema,
		maxOutputTokens: openRouterConfig.specMaxOutputTokens,
	});
}

const SPEC_MAX_ATTEMPTS = 2;
const SPEC_RETRY_DELAY_MS = 2000;

const RETRYABLE_AI_ERROR_CODES: ReadonlySet<TAiProviderErrorCode> = new Set([
	'api_error',
	'incomplete',
	'parse_error',
]);

function isRetryableAiError(error: unknown): error is AiProviderError {
	return (
		error instanceof AiProviderError && RETRYABLE_AI_ERROR_CODES.has(error.code)
	);
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateProjectSpecWithRetry(
	messages: IChatMessage[],
	brief: IProjectBrief,
	locale: TLocale = 'ru',
): Promise<IProjectSpecJson> {
	for (let attempt = 1; attempt <= SPEC_MAX_ATTEMPTS; attempt++) {
		try {
			return await generateProjectSpec(messages, brief, locale);
		} catch (error) {
			const canRetry = isRetryableAiError(error) && attempt < SPEC_MAX_ATTEMPTS;
			if (!canRetry) {
				throw error;
			}

			logger.warn(
				`Project spec generation failed (attempt ${attempt}/${SPEC_MAX_ATTEMPTS}), retrying`,
				{ code: error.code },
			);
			await delay(SPEC_RETRY_DELAY_MS);
		}
	}

	throw new Error('Project spec generation failed after retries');
}
