import logger from '../../config/logger';
import type { IChatMessage } from '../../models/chatSession.model';
import type { IInterviewTurn, IProjectBrief } from '../../types/interview.types';
import type { TLocale } from '../../types/locale.types';
import { getInterviewSystemPrompt } from './interview.prompt';
import { interviewResponseSchema } from './interview.schema';
import {
	isTooLong,
	limitText,
	getShortenRetryInstruction,
} from './messageLength';
import {
	createStructuredResponse,
	type TProviderMessage,
} from './openai.provider';

const MAX_HISTORY_MESSAGES = 20;

function buildBriefContext(brief: IProjectBrief, locale: TLocale): string {
	if (locale === 'en') {
		return [
			'Current request state:',
			`- stage: ${brief.stage}`,
			`- task_summary: ${brief.taskSummary ?? 'not filled'}`,
			`- expected_result: ${brief.expectedResult ?? 'not filled'}`,
			`- project_type: ${brief.projectType ?? 'not filled'}`,
			`- understanding_confirmed: ${brief.understandingConfirmed}`,
			`- contact: ${brief.contact ?? 'not filled'}`,
			`- lead_complete: ${brief.leadComplete}`,
		].join('\n');
	}

	return [
		'Текущее состояние заявки:',
		`- stage: ${brief.stage}`,
		`- task_summary: ${brief.taskSummary ?? 'не заполнено'}`,
		`- expected_result: ${brief.expectedResult ?? 'не заполнено'}`,
		`- project_type: ${brief.projectType ?? 'не заполнено'}`,
		`- understanding_confirmed: ${brief.understandingConfirmed}`,
		`- contact: ${brief.contact ?? 'не заполнено'}`,
		`- lead_complete: ${brief.leadComplete}`,
	].join('\n');
}

function toProviderMessages(messages: IChatMessage[]): TProviderMessage[] {
	return messages.slice(-MAX_HISTORY_MESSAGES).map((message) => ({
		role: message.role,
		content: message.text,
	}));
}

function validateInterviewTurn(raw: IInterviewTurn): IInterviewTurn {
	if (!raw.message?.trim()) {
		throw new Error('Interview turn is missing message');
	}

	return {
		message: raw.message.trim(),
		message_type: raw.message_type,
		stage: raw.stage,
		task_summary: raw.task_summary,
		expected_result: raw.expected_result,
		understanding_confirmed: Boolean(raw.understanding_confirmed),
		contact: raw.contact,
		lead_complete: Boolean(raw.lead_complete),
		brief_updates: {
			project_type: raw.brief_updates?.project_type ?? null,
		},
	};
}

async function requestInterviewTurn(
	messages: IChatMessage[],
	brief: IProjectBrief,
	locale: TLocale,
	extraInstruction?: string,
): Promise<IInterviewTurn> {
	const input: TProviderMessage[] = [
		{
			role: 'developer',
			content: buildBriefContext(brief, locale),
		},
		...toProviderMessages(messages),
	];

	if (extraInstruction) {
		input.push({
			role: 'developer',
			content: extraInstruction,
		});
	}

	const raw = await createStructuredResponse<IInterviewTurn>({
		instructions: getInterviewSystemPrompt(locale),
		input,
		schemaName: 'interview_turn',
		schema: interviewResponseSchema,
		maxOutputTokens: 250,
	});

	return validateInterviewTurn(raw);
}

export async function generateInterviewTurn(
	messages: IChatMessage[],
	brief: IProjectBrief,
	locale: TLocale = 'ru',
): Promise<IInterviewTurn> {
	let turn = await requestInterviewTurn(messages, brief, locale);

	if (!isTooLong(turn.message)) {
		return turn;
	}

	logger.warn('Interview response exceeded length limit, retrying with shorten instruction');

	turn = await requestInterviewTurn(
		messages,
		brief,
		locale,
		getShortenRetryInstruction(locale),
	);

	if (!isTooLong(turn.message)) {
		return turn;
	}

	logger.warn('Interview response still too long after retry, applying fallback truncation');

	return {
		...turn,
		message: limitText(turn.message),
	};
}
