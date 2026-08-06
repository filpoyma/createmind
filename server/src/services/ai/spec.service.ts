import type { IChatMessage } from '../../models/chatSession.model';
import type {
	IProjectBrief,
	IProjectSpecJson,
} from '../../types/interview.types';
import { createStructuredResponse } from './openai.provider';
import { SPEC_SYSTEM_PROMPT } from './spec.prompt';
import { specResponseSchema } from './spec.schema';

export function renderSpecText(spec: IProjectSpecJson): string {
	const sections = [
		`# ${spec.title}`,
		'',
		'## Краткое описание',
		spec.summary,
		'',
		'## Цели',
		...spec.goals.map((goal) => `- ${goal}`),
		'',
		'## Область работ',
		...spec.scope.map((item) => `- ${item}`),
		'',
		'## Результаты',
		...spec.deliverables.map((item) => `- ${item}`),
		'',
		'## Открытые вопросы',
		...(spec.open_questions.length
			? spec.open_questions.map((item) => `- ${item}`)
			: ['- Нет']),
		'',
		'## Контакт',
		spec.contact,
	];

	return sections.join('\n');
}

export async function generateProjectSpec(
	messages: IChatMessage[],
	brief: IProjectBrief,
): Promise<IProjectSpecJson> {
	const dialog = messages
		.map((message) => `${message.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${message.text}`)
		.join('\n');

	const briefContext = [
		'Данные заявки:',
		`- Задача: ${brief.taskSummary ?? '—'}`,
		`- Ожидаемый результат: ${brief.expectedResult ?? '—'}`,
		`- Тип проекта: ${brief.projectType ?? '—'}`,
		`- Контакт: ${brief.contact ?? '—'}`,
		'',
		'Диалог:',
		dialog,
	].join('\n');

	return createStructuredResponse<IProjectSpecJson>({
		instructions: SPEC_SYSTEM_PROMPT,
		input: [{ role: 'user', content: briefContext }],
		schemaName: 'project_spec',
		schema: specResponseSchema,
		maxOutputTokens: 2000,
	});
}
