import { Schema, model, type Document } from 'mongoose';
import type { TInterviewStage } from '../types/interview.types';
import type { TLocale } from '../types/locale.types';

export type TChatRole = 'user' | 'assistant';

export interface IChatMessage {
	role: TChatRole;
	text: string;
	createdAt: Date;
}

export interface IProjectBriefDoc {
	taskSummary?: string;
	expectedResult?: string;
	projectType?: string;
	contact?: string;
	understandingConfirmed: boolean;
	leadComplete: boolean;
	stage: TInterviewStage;
}

export interface IProjectSpecDoc {
	text: string;
	json: Record<string, unknown>;
	generatedAt: Date;
}

export interface IChatSession extends Document {
	chatId: string;
	locale: TLocale;
	fingerprintHash?: string;
	ownerFingerprint?: string;
	previousChatIds: string[];
	messages: IChatMessage[];
	brief: IProjectBriefDoc;
	spec?: IProjectSpecDoc;
	specEmailSentAt?: Date;
	specTelegramSentAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
	{
		role: {
			type: String,
			enum: ['user', 'assistant'],
			required: true,
		},
		text: {
			type: String,
			required: true,
			trim: true,
			maxlength: 4000,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ _id: false },
);

const projectBriefSchema = new Schema<IProjectBriefDoc>(
	{
		taskSummary: { type: String, trim: true },
		expectedResult: { type: String, trim: true },
		projectType: { type: String, trim: true },
		contact: { type: String, trim: true },
		understandingConfirmed: { type: Boolean, default: false },
		leadComplete: { type: Boolean, default: false },
		stage: {
			type: String,
			enum: ['discovery', 'confirmation', 'contact', 'completed'],
			default: 'discovery',
		},
	},
	{ _id: false },
);

const projectSpecSchema = new Schema<IProjectSpecDoc>(
	{
		text: { type: String, required: true },
		json: { type: Schema.Types.Mixed, required: true },
		generatedAt: { type: Date, default: Date.now },
	},
	{ _id: false },
);

const chatSessionSchema = new Schema<IChatSession>(
	{
		chatId: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		locale: {
			type: String,
			enum: ['ru', 'en'],
			default: 'ru',
		},
		fingerprintHash: {
			type: String,
			index: true,
			sparse: true,
		},
		ownerFingerprint: {
			type: String,
			index: true,
			sparse: true,
		},
		previousChatIds: {
			type: [String],
			default: [],
		},
		messages: {
			type: [chatMessageSchema],
			default: [],
		},
		brief: {
			type: projectBriefSchema,
			default: () => ({
				understandingConfirmed: false,
				leadComplete: false,
				stage: 'discovery',
			}),
		},
		spec: {
			type: projectSpecSchema,
			required: false,
		},
		specEmailSentAt: {
			type: Date,
			required: false,
		},
		specTelegramSentAt: {
			type: Date,
			required: false,
		},
	},
	{
		timestamps: true,
	},
);

export const ChatSession = model<IChatSession>('ChatSession', chatSessionSchema);
