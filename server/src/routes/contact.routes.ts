import { Router } from 'express';
import {
	submitContactForm,
	contactFormValidation,
} from '../controllers/contact.controller';
import { strictRateLimiter } from '../middleware/security/rateLimiter';

const router = Router();

router.post('/', strictRateLimiter, contactFormValidation, submitContactForm);

export default router;
