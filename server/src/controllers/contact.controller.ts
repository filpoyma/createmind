import { Request, Response } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validator';
import { HTTP_STATUS } from '../constants/status.constants';
import { isTelegramConfigured } from '../config/telegram';
import { sendContactFormTelegram } from '../services/telegram/contactTelegram.service';
import { parseLocale } from '../types/locale.types';

interface IContactFormBody {
	name?: string;
	phone?: string;
	task?: string;
	locale?: string;
}

export const submitContactForm = asyncHandler(
	async (req: Request, res: Response): Promise<void> => {
		if (!isTelegramConfigured) {
			res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
				success: false,
				message: 'Сервис заявок временно недоступен',
			});
			return;
		}

		const { name, phone, task, locale } = req.body as IContactFormBody;
		const resolvedLocale = parseLocale(locale ?? req.header('X-Locale') ?? undefined);

		const sent = await sendContactFormTelegram({
			name: name as string,
			phone: phone as string,
			task: task as string,
			locale: resolvedLocale,
		});

		if (!sent) {
			res.status(HTTP_STATUS.BAD_GATEWAY).json({
				success: false,
				message: 'Не удалось отправить заявку. Попробуйте позже.',
			});
			return;
		}

		res.status(HTTP_STATUS.OK).json({
			success: true,
		});
	},
);

export const contactFormValidation = validate([
	body('name')
		.isString()
		.trim()
		.notEmpty()
		.isLength({ max: 200 })
		.withMessage('name is required and must be at most 200 characters'),
	body('phone')
		.isString()
		.trim()
		.notEmpty()
		.isLength({ max: 200 })
		.withMessage('phone is required and must be at most 200 characters'),
	body('task')
		.isString()
		.trim()
		.notEmpty()
		.isLength({ max: 4000 })
		.withMessage('task is required and must be at most 4000 characters'),
	body('locale').optional().isIn(['ru', 'en']).withMessage('locale must be ru or en'),
]);
