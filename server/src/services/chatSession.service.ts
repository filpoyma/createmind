import { randomUUID } from 'crypto';
import {
	ChatSession,
	type IChatSession,
} from '../models/chatSession.model';
import {
	MAX_PROJECTS_PER_USER,
	ProjectLimitReachedError,
} from '../constants/chat.limits';

const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FINGERPRINT_REGEX = /^[a-zA-Z0-9]{8,64}$/;

export function isValidChatId(chatId: string): boolean {
	return UUID_REGEX.test(chatId);
}

export function isValidFingerprint(fingerprint: string): boolean {
	return FINGERPRINT_REGEX.test(fingerprint);
}

function getOwnerFingerprint(session: IChatSession): string | undefined {
	return session.ownerFingerprint ?? session.fingerprintHash;
}

export async function countUserProjects(fingerprint: string): Promise<number> {
	return ChatSession.countDocuments({
		$or: [{ ownerFingerprint: fingerprint }, { fingerprintHash: fingerprint }],
	});
}

export async function canUserStartNewProject(
	fingerprint?: string,
): Promise<boolean> {
	if (!fingerprint) return true;
	const count = await countUserProjects(fingerprint);
	return count < MAX_PROJECTS_PER_USER;
}

async function assertCanCreateProject(fingerprint?: string): Promise<void> {
	if (!fingerprint) return;

	const count = await countUserProjects(fingerprint);
	if (count >= MAX_PROJECTS_PER_USER) {
		throw new ProjectLimitReachedError();
	}
}

async function updateFingerprint(
	session: IChatSession,
	fingerprint?: string,
): Promise<void> {
	if (!fingerprint) return;

	session.fingerprintHash = fingerprint;
	if (!session.ownerFingerprint) {
		session.ownerFingerprint = fingerprint;
	}

	await session.save();
}

export async function findSessionByChatId(
	chatId: string,
	fingerprint?: string,
) {
	const session = await ChatSession.findOne({
		$or: [{ chatId }, { previousChatIds: chatId }],
	});

	if (!session) return null;

	await updateFingerprint(session, fingerprint);
	return session;
}

export async function resolveOrCreateSession(
	chatId: string,
	fingerprint?: string,
) {
	const existingByChatId = await ChatSession.findOne({ chatId });
	if (existingByChatId) {
		await updateFingerprint(existingByChatId, fingerprint);
		return {
			session: existingByChatId,
			restored: false,
		};
	}

	if (fingerprint) {
		const existingByFingerprint = await ChatSession.findOne({
			fingerprintHash: fingerprint,
		});

		if (existingByFingerprint) {
			const oldChatId = existingByFingerprint.chatId;
			existingByFingerprint.chatId = chatId;

			if (!existingByFingerprint.previousChatIds.includes(oldChatId)) {
				existingByFingerprint.previousChatIds.push(oldChatId);
			}

			existingByFingerprint.fingerprintHash = fingerprint;
			if (!existingByFingerprint.ownerFingerprint) {
				existingByFingerprint.ownerFingerprint = fingerprint;
			}

			await existingByFingerprint.save();

			return {
				session: existingByFingerprint,
				restored: true,
			};
		}
	}

	await assertCanCreateProject(fingerprint);

	const session = await ChatSession.create({
		chatId,
		fingerprintHash: fingerprint,
		ownerFingerprint: fingerprint,
		previousChatIds: [],
		messages: [],
		brief: {
			understandingConfirmed: false,
			leadComplete: false,
			stage: 'discovery',
		},
	});

	return {
		session,
		restored: false,
	};
}

export async function createNewChatSession(
	currentChatId: string,
	fingerprint?: string,
): Promise<IChatSession | null> {
	const current = await ChatSession.findOne({ chatId: currentChatId });
	if (!current || !current.brief.leadComplete) {
		return null;
	}

	await assertCanCreateProject(fingerprint);

	const newChatId = randomUUID();

	if (fingerprint) {
		if (!current.ownerFingerprint) {
			current.ownerFingerprint = fingerprint;
		}

		current.fingerprintHash = undefined;
		await current.save();
	}

	return ChatSession.create({
		chatId: newChatId,
		fingerprintHash: fingerprint,
		ownerFingerprint: fingerprint,
		previousChatIds: [],
		messages: [],
		brief: {
			understandingConfirmed: false,
			leadComplete: false,
			stage: 'discovery',
		},
	});
}

export async function getCanStartNewProjectForSession(
	session: IChatSession,
): Promise<boolean> {
	const fingerprint = getOwnerFingerprint(session);
	return canUserStartNewProject(fingerprint);
}
