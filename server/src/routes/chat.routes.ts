import { Router } from 'express';
import {
	addChatMessage,
	addMessageValidation,
	chatIdParamValidation,
	getChatSession,
	resolveChatSession,
	resolveSessionValidation,
} from '../controllers/chat.controller';
import { strictRateLimiter } from '../middleware/security/rateLimiter';

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
	chatIdParamValidation,
	addMessageValidation,
	addChatMessage,
);

export default router;
