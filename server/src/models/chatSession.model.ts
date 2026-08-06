import { Schema, model, type Document } from 'mongoose';

export type TChatRole = 'user' | 'assistant';

export interface IChatMessage {
	role: TChatRole;
	text: string;
	createdAt: Date;
}

export interface IChatSession extends Document {
	chatId: string;
	fingerprintHash?: string;
	previousChatIds: string[];
	messages: IChatMessage[];
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

const chatSessionSchema = new Schema<IChatSession>(
	{
		chatId: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		fingerprintHash: {
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
	},
	{
		timestamps: true,
	},
);

export const ChatSession = model<IChatSession>('ChatSession', chatSessionSchema);
