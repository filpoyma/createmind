import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validator';
import { HTTP_STATUS } from '../constants/status.constants';
import {
	addMessageToSession,
	findSessionByChatId,
	isValidChatId,
	isValidFingerprint,
	resolveOrCreateSession,
	toSessionResponse,
} from '../services/chatSession.service';

interface IResolveSessionBody {
	chatId?: string;
	fingerprint?: string;
}

interface IAddMessageBody {
	role?: string;
	text?: string;
}

function getFingerprintFromRequest(req: Request): string | undefined {
	const headerValue = req.header('X-Device-Fp');
	if (typeof headerValue === 'string' && isValidFingerprint(headerValue)) {
		return headerValue;
	}

	const bodyFingerprint = (req.body as IResolveSessionBody).fingerprint;
	if (typeof bodyFingerprint === 'string' && isValidFingerprint(bodyFingerprint)) {
		return bodyFingerprint;
	}

	return undefined;
}

function getChatIdFromRequest(req: Request): string | undefined {
	const paramChatId = req.params.chatId;
	if (typeof paramChatId === 'string' && isValidChatId(paramChatId)) {
		return paramChatId;
	}

	const headerChatId = req.header('X-Chat-Id');
	if (typeof headerChatId === 'string' && isValidChatId(headerChatId)) {
		return headerChatId;
	}

	const bodyChatId = (req.body as IResolveSessionBody).chatId;
	if (typeof bodyChatId === 'string' && isValidChatId(bodyChatId)) {
		return bodyChatId;
	}

	return undefined;
}

export const getChatSession = asyncHandler(
	async (req: Request, res: Response): Promise<void> => {
		const chatId = getChatIdFromRequest(req);

		if (!chatId) {
			res.status(HTTP_STATUS.BAD_REQUEST).json({
				success: false,
				message: 'Некорректный идентификатор чата',
			});
			return;
		}

		const fingerprint = getFingerprintFromRequest(req);
		const session = await findSessionByChatId(chatId, fingerprint);

		if (!session) {
			res.status(HTTP_STATUS.NOT_FOUND).json({
				success: false,
				message: 'Сессия чата не найдена',
			});
			return;
		}

		res.status(HTTP_STATUS.OK).json({
			success: true,
			data: toSessionResponse(session),
		});
	},
);

export const resolveChatSession = asyncHandler(
	async (req: Request, res: Response): Promise<void> => {
		const chatId = getChatIdFromRequest(req);

		if (!chatId) {
			res.status(HTTP_STATUS.BAD_REQUEST).json({
				success: false,
				message: 'Некорректный идентификатор чата',
			});
			return;
		}

		const fingerprint = getFingerprintFromRequest(req);
		const { session, restored } = await resolveOrCreateSession(chatId, fingerprint);

		res.status(HTTP_STATUS.OK).json({
			success: true,
			data: toSessionResponse(session, restored),
		});
	},
);

export const addChatMessage = asyncHandler(
	async (req: Request, res: Response): Promise<void> => {
		const chatId = getChatIdFromRequest(req);

		if (!chatId) {
			res.status(HTTP_STATUS.BAD_REQUEST).json({
				success: false,
				message: 'Некорректный идентификатор чата',
			});
			return;
		}

		const { role, text } = req.body as IAddMessageBody;
		const fingerprint = getFingerprintFromRequest(req);

		const session = await addMessageToSession(
			chatId,
			role as 'user' | 'assistant',
			text as string,
			fingerprint,
		);

		if (!session) {
			res.status(HTTP_STATUS.NOT_FOUND).json({
				success: false,
				message: 'Сессия чата не найдена',
			});
			return;
		}

		res.status(HTTP_STATUS.OK).json({
			success: true,
			data: {
				messages: toSessionResponse(session).messages,
			},
		});
	},
);

export const resolveSessionValidation = validate([
	body('chatId')
		.isUUID()
		.withMessage('chatId must be a valid UUID'),
	body('fingerprint')
		.optional()
		.isString()
		.isLength({ min: 8, max: 64 })
		.matches(/^[a-zA-Z0-9]+$/)
		.withMessage('fingerprint has invalid format'),
]);

export const chatIdParamValidation = validate([
	param('chatId').isUUID().withMessage('chatId must be a valid UUID'),
]);

export const addMessageValidation = validate([
	param('chatId').isUUID().withMessage('chatId must be a valid UUID'),
	body('role')
		.isIn(['user', 'assistant'])
		.withMessage('role must be user or assistant'),
	body('text')
		.isString()
		.trim()
		.notEmpty()
		.isLength({ max: 4000 })
		.withMessage('text is required and must be at most 4000 characters'),
]);
