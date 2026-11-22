import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validator';
import { HTTP_STATUS } from '../constants/status.constants';
import { ProjectLimitReachedError } from '../constants/chat.limits';
import { isOpenRouterConfigured } from '../config/openrouter';
import type { IChatSession } from '../models/chatSession.model';
import {
	createNewChatSession,
	findSessionByChatId,
	getCanStartNewProjectForSession,
	isValidChatId,
	isValidFingerprint,
	resolveOrCreateSession,
} from '../services/chatSession.service';
import { generateInterviewTurn } from '../services/ai/interview.service';
import {
	generateProjectSpecWithRetry,
	renderSpecText,
} from '../services/ai/spec.service';
import { AiProviderError } from '../services/ai/openrouter.provider';
import { sendProjectSpecEmail } from '../services/email/specEmail.service';
import { sendProjectSpecTelegram } from '../services/telegram/specTelegram.service';
import {
	applyInterviewTurn,
	canGenerateSpec,
	MAX_SESSION_MESSAGES,
	saveProjectSpec,
	toSessionResponse,
} from '../services/projectBrief.service';
import { getSessionLocale, parseLocale } from '../types/locale.types';

interface IResolveSessionBody {
	chatId?: string;
	fingerprint?: string;
}

interface ISendMessageBody {
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

function getLocaleFromRequest(req: Request) {
	return parseLocale(req.header('X-Locale') ?? undefined);
}

async function buildSessionPayload(session: IChatSession, restored = false) {
	const canStartNewProject = await getCanStartNewProjectForSession(session);
	return toSessionResponse(session, restored, canStartNewProject);
}

async function deliverProjectSpecEmail(
	session: IChatSession,
	specText: string,
	title?: string,
): Promise<void> {
	if (session.specEmailSentAt) return;

	const sent = await sendProjectSpecEmail({
		chatId: session.chatId,
		specText,
		brief: session.brief,
		title,
	});

	if (!sent) return;

	session.specEmailSentAt = new Date();
	await session.save();
}

async function deliverProjectSpecTelegram(
	session: IChatSession,
	specText: string,
	title?: string,
): Promise<void> {
	if (session.specTelegramSentAt) return;

	const sent = await sendProjectSpecTelegram({
		chatId: session.chatId,
		specText,
		brief: session.brief,
		title,
	});

	if (!sent) return;

	session.specTelegramSentAt = new Date();
	await session.save();
}

async function deliverProjectSpecNotifications(
	session: IChatSession,
	specText: string,
	title?: string,
): Promise<void> {
	await deliverProjectSpecEmail(session, specText, title);
	await deliverProjectSpecTelegram(session, specText, title);
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
			data: await buildSessionPayload(session),
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

		try {
			const { session, restored } = await resolveOrCreateSession(
				chatId,
				fingerprint,
				getLocaleFromRequest(req),
			);

			res.status(HTTP_STATUS.OK).json({
				success: true,
				data: await buildSessionPayload(session, restored),
			});
		} catch (error) {
			if (error instanceof ProjectLimitReachedError) {
				res.status(HTTP_STATUS.FORBIDDEN).json({
					success: false,
					code: error.code,
					message: error.message,
				});
				return;
			}

			throw error;
		}
	},
);

export const sendChatMessage = asyncHandler(
	async (req: Request, res: Response): Promise<void> => {
		if (!isOpenRouterConfigured) {
			res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
				success: false,
				message: 'AI-сервис не настроен',
			});
			return;
		}

		const chatId = getChatIdFromRequest(req);

		if (!chatId) {
			res.status(HTTP_STATUS.BAD_REQUEST).json({
				success: false,
				message: 'Некорректный идентификатор чата',
			});
			return;
		}

		const { text } = req.body as ISendMessageBody;
		const fingerprint = getFingerprintFromRequest(req);

		let session = await findSessionByChatId(chatId, fingerprint);
		if (!session) {
			try {
				const resolved = await resolveOrCreateSession(
					chatId,
					fingerprint,
					getLocaleFromRequest(req),
				);
				session = resolved.session;
			} catch (error) {
				if (error instanceof ProjectLimitReachedError) {
					res.status(HTTP_STATUS.FORBIDDEN).json({
						success: false,
						code: error.code,
						message: error.message,
					});
					return;
				}

				throw error;
			}
		}

		if (session.messages.length >= MAX_SESSION_MESSAGES) {
			res.status(HTTP_STATUS.BAD_REQUEST).json({
				success: false,
				message: 'Достигнут лимит сообщений в чате',
			});
			return;
		}

		if (session.brief.leadComplete) {
			const canStartNewProject = await getCanStartNewProjectForSession(session);
			res.status(HTTP_STATUS.BAD_REQUEST).json({
				success: false,
				code: 'LEAD_COMPLETE',
				canStartNewProject,
				message: canStartNewProject
					? 'Заявка уже завершена. Можно сформировать ТЗ или начать новую заявку.'
					: 'Заявка уже завершена. Достигнут лимит в 3 проекта — можно сформировать ТЗ по текущему проекту.',
			});
			return;
		}

		session.messages.push({
			role: 'user',
			text: text as string,
			createdAt: new Date(),
		});
		await session.save();

		try {
			const sessionLocale = getSessionLocale(session);
			const turn = await generateInterviewTurn(
				session.messages,
				{
					taskSummary: session.brief.taskSummary,
					expectedResult: session.brief.expectedResult,
					projectType: session.brief.projectType,
					contact: session.brief.contact,
					understandingConfirmed: session.brief.understandingConfirmed,
					leadComplete: session.brief.leadComplete,
					stage: session.brief.stage,
				},
				sessionLocale,
			);

			applyInterviewTurn(session, turn);
			await session.save();

			res.status(HTTP_STATUS.OK).json({
				success: true,
				data: await buildSessionPayload(session),
			});
		} catch (error) {
			if (error instanceof AiProviderError) {
				res.status(error.statusCode).json({
					success: false,
					message: 'Не удалось получить ответ AI. Попробуйте ещё раз.',
				});
				return;
			}

			throw error;
		}
	},
);

export const generateChatSpec = asyncHandler(
	async (req: Request, res: Response): Promise<void> => {
		if (!isOpenRouterConfigured) {
			res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
				success: false,
				message: 'AI-сервис не настроен',
			});
			return;
		}

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

		const brief = {
			taskSummary: session.brief.taskSummary,
			expectedResult: session.brief.expectedResult,
			projectType: session.brief.projectType,
			contact: session.brief.contact,
			understandingConfirmed: session.brief.understandingConfirmed,
			leadComplete: session.brief.leadComplete,
			stage: session.brief.stage,
		};

		if (!canGenerateSpec(brief)) {
			res.status(HTTP_STATUS.CONFLICT).json({
				success: false,
				message: 'Заявка ещё не завершена',
			});
			return;
		}

			if (session.spec) {
				await deliverProjectSpecNotifications(
					session,
					session.spec.text,
					typeof session.spec.json?.title === 'string' ? session.spec.json.title : undefined,
				);

			res.status(HTTP_STATUS.OK).json({
				success: true,
				data: {
					text: session.spec.text,
					json: session.spec.json,
					generatedAt: session.spec.generatedAt.toISOString(),
				},
			});
			return;
		}

		try {
			const sessionLocale = getSessionLocale(session);
			const specJson = await generateProjectSpecWithRetry(
				session.messages,
				brief,
				sessionLocale,
			);
			const specText = renderSpecText(specJson, sessionLocale);
			const generatedAt = new Date();

			saveProjectSpec(session, {
				text: specText,
				json: specJson,
				generatedAt,
			});

				await session.save();
				await deliverProjectSpecNotifications(session, specText, specJson.title);

			res.status(HTTP_STATUS.OK).json({
				success: true,
				data: {
					text: specText,
					json: specJson,
					generatedAt: generatedAt.toISOString(),
				},
			});
		} catch (error) {
			if (error instanceof AiProviderError) {
				res.status(error.statusCode).json({
					success: false,
					message: 'Не удалось сформировать ТЗ. Попробуйте ещё раз.',
				});
				return;
			}

			throw error;
		}
	},
);

export const restartChatSession = asyncHandler(
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

		try {
			const session = await createNewChatSession(
				chatId,
				fingerprint,
				getLocaleFromRequest(req),
			);

			if (!session) {
				res.status(HTTP_STATUS.CONFLICT).json({
					success: false,
					message: 'Новую заявку можно начать только после завершения текущей',
				});
				return;
			}

			res.status(HTTP_STATUS.CREATED).json({
				success: true,
				data: await buildSessionPayload(session),
			});
		} catch (error) {
			if (error instanceof ProjectLimitReachedError) {
				res.status(HTTP_STATUS.FORBIDDEN).json({
					success: false,
					code: error.code,
					message: error.message,
				});
				return;
			}

			throw error;
		}
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

export const sendMessageValidation = validate([
	param('chatId').isUUID().withMessage('chatId must be a valid UUID'),
	body('text')
		.isString()
		.trim()
		.notEmpty()
		.isLength({ max: 4000 })
		.withMessage('text is required and must be at most 4000 characters'),
]);
