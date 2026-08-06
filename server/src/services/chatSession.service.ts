import {
	ChatSession,
	type IChatSession,
	type TChatRole,
} from '../models/chatSession.model';

const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FINGERPRINT_REGEX = /^[a-zA-Z0-9]{8,64}$/;

export function isValidChatId(chatId: string): boolean {
	return UUID_REGEX.test(chatId);
}

export function isValidFingerprint(fingerprint: string): boolean {
	return FINGERPRINT_REGEX.test(fingerprint);
}

function toSessionResponse(session: IChatSession, restored = false) {
	return {
		chatId: session.chatId,
		messages: session.messages.map((message) => ({
			role: message.role,
			text: message.text,
			createdAt: message.createdAt.toISOString(),
		})),
		restored,
	};
}

async function updateFingerprint(
	session: IChatSession,
	fingerprint?: string,
): Promise<void> {
	if (!fingerprint) return;
	session.fingerprintHash = fingerprint;
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
			await existingByFingerprint.save();

			return {
				session: existingByFingerprint,
				restored: true,
			};
		}
	}

	const session = await ChatSession.create({
		chatId,
		fingerprintHash: fingerprint,
		previousChatIds: [],
		messages: [],
	});

	return {
		session,
		restored: false,
	};
}

export async function addMessageToSession(
	chatId: string,
	role: TChatRole,
	text: string,
	fingerprint?: string,
) {
	const session = await findSessionByChatId(chatId, fingerprint);
	if (!session) return null;

	session.messages.push({
		role,
		text,
		createdAt: new Date(),
	});

	await session.save();
	return session;
}

export { toSessionResponse };
