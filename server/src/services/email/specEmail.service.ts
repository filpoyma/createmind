import { Resend } from 'resend';
import logger, { logError } from '../../config/logger';
import { isResendConfigured, resendConfig } from '../../config/resend';
import type { IProjectBriefDoc } from '../../models/chatSession.model';

let resendClient: Resend | null = null;

function getClient(): Resend {
	if (!isResendConfigured) {
		throw new Error('Resend API key is not configured');
	}

	if (!resendClient) {
		resendClient = new Resend(resendConfig.apiKey);
	}

	return resendClient;
}

export async function sendProjectSpecEmail(params: {
	chatId: string;
	specText: string;
	brief: Pick<IProjectBriefDoc, 'taskSummary' | 'projectType' | 'contact'>;
	title?: string;
}): Promise<boolean> {
	if (!isResendConfigured) {
		logger.warn('Resend is not configured — spec email was not sent');
		return false;
	}

	const subjectTitle = params.title?.trim() || params.brief.taskSummary?.trim() || 'Новая заявка';
	const subject = `CreateMind: ${subjectTitle}`;

	const meta = [
		`Chat ID: ${params.chatId}`,
		`Тип проекта: ${params.brief.projectType ?? '—'}`,
		`Контакт: ${params.brief.contact ?? '—'}`,
		'',
		'---',
		'',
	].join('\n');

	try {
		const { error } = await getClient().emails.send({
			from: resendConfig.from,
			to: resendConfig.specTo,
			subject,
			text: `${meta}${params.specText}`,
		});

		if (error) {
			logError('Failed to send project spec email via Resend', error);
			return false;
		}

		logger.info(`Project spec email sent to ${resendConfig.specTo} for chat ${params.chatId}`);
		return true;
	} catch (error) {
		logError('Failed to send project spec email via Resend', error);
		return false;
	}
}
