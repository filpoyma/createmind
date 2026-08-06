import type { IChatSession } from '../models/chatSession.model';
import type {
	IInterviewTurn,
	IProjectBrief,
	IProjectSpec,
	ISessionResponse,
} from '../types/interview.types';

export const MAX_SESSION_MESSAGES = 50;

export function toBriefDto(session: IChatSession): IProjectBrief {
	return {
		taskSummary: session.brief.taskSummary,
		expectedResult: session.brief.expectedResult,
		projectType: session.brief.projectType,
		contact: session.brief.contact,
		understandingConfirmed: session.brief.understandingConfirmed,
		leadComplete: session.brief.leadComplete,
		stage: session.brief.stage,
	};
}

export function getMissingBriefFields(brief: IProjectBrief): string[] {
	const missing: string[] = [];

	if (!brief.taskSummary) missing.push('taskSummary');
	if (!brief.expectedResult) missing.push('expectedResult');
	if (!brief.understandingConfirmed) missing.push('understandingConfirmed');
	if (!brief.contact) missing.push('contact');

	return missing;
}

export function canGenerateSpec(brief: IProjectBrief): boolean {
	return brief.leadComplete;
}

export function toSessionResponse(
	session: IChatSession,
	restored = false,
	canStartNewProject = true,
): ISessionResponse {
	const brief = toBriefDto(session);

	return {
		chatId: session.chatId,
		messages: session.messages.map((message) => ({
			role: message.role,
			text: message.text,
			createdAt: message.createdAt.toISOString(),
		})),
		brief,
		leadComplete: brief.leadComplete,
		canGenerateSpec: canGenerateSpec(brief),
		hasSpec: Boolean(session.spec),
		canStartNewProject,
		restored,
	};
}

export function applyInterviewTurn(
	session: IChatSession,
	turn: IInterviewTurn,
): void {
	if (turn.task_summary) {
		session.brief.taskSummary = turn.task_summary;
	}

	if (turn.expected_result) {
		session.brief.expectedResult = turn.expected_result;
	}

	if (turn.brief_updates.project_type) {
		session.brief.projectType = turn.brief_updates.project_type;
	}

	if (turn.contact) {
		session.brief.contact = turn.contact;
	}

	session.brief.understandingConfirmed = turn.understanding_confirmed;
	session.brief.leadComplete = turn.lead_complete;
	session.brief.stage = turn.stage;

	session.messages.push({
		role: 'assistant',
		text: turn.message,
		createdAt: new Date(),
	});
}

export function saveProjectSpec(
	session: IChatSession,
	spec: IProjectSpec,
): void {
	session.spec = {
		text: spec.text,
		json: spec.json as unknown as Record<string, unknown>,
		generatedAt: spec.generatedAt,
	};
}
