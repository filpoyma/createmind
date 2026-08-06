export type TInterviewStage = 'discovery' | 'confirmation' | 'contact' | 'completed';

export type TMessageType = 'question' | 'confirmation' | 'clarification' | 'closing';

export interface IInterviewBriefUpdates {
	project_type: string | null;
}

export interface IInterviewTurn {
	message: string;
	message_type: TMessageType;
	stage: TInterviewStage;
	task_summary: string | null;
	expected_result: string | null;
	understanding_confirmed: boolean;
	contact: string | null;
	lead_complete: boolean;
	brief_updates: IInterviewBriefUpdates;
}

export interface IProjectBrief {
	taskSummary?: string;
	expectedResult?: string;
	projectType?: string;
	contact?: string;
	understandingConfirmed: boolean;
	leadComplete: boolean;
	stage: TInterviewStage;
}

export interface IProjectSpecJson {
	title: string;
	summary: string;
	goals: string[];
	scope: string[];
	deliverables: string[];
	open_questions: string[];
	contact: string;
}

export interface IProjectSpec {
	text: string;
	json: IProjectSpecJson;
	generatedAt: Date;
}

export interface IChatMessageDto {
	role: 'user' | 'assistant';
	text: string;
	createdAt: string;
}

export interface ISessionResponse {
	chatId: string;
	messages: IChatMessageDto[];
	brief: IProjectBrief;
	leadComplete: boolean;
	canGenerateSpec: boolean;
	hasSpec: boolean;
	canStartNewProject: boolean;
	restored?: boolean;
}
