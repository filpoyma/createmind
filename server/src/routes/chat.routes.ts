import { Router } from 'express';
import {
	chatIdParamValidation,
	generateChatSpec,
	getChatSession,
	restartChatSession,
	resolveChatSession,
	resolveSessionValidation,
	sendChatMessage,
	sendMessageValidation,
} from '../controllers/chat.controller';
import { aiRateLimiter, strictRateLimiter } from '../middleware/security/rateLimiter';

const router = Router();

router.get('/sessions/:chatId', chatIdParamValidation, getChatSession);
router.post(
	'/sessions',
	strictRateLimiter,
	resolveSessionValidation,
	resolveChatSession,
);
router.post(
	'/sessions/:chatId/messages',
	aiRateLimiter,
	chatIdParamValidation,
	sendMessageValidation,
	sendChatMessage,
);
router.post(
	'/sessions/:chatId/spec',
	aiRateLimiter,
	chatIdParamValidation,
	generateChatSpec,
);
router.post(
	'/sessions/:chatId/restart',
	strictRateLimiter,
	chatIdParamValidation,
	restartChatSession,
);

export default router;
