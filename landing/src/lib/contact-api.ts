import { getApiUrl } from './api';
import { getCurrentLang } from './lang';

export interface IContactFormPayload {
	name: string;
	phone: string;
	task: string;
}

interface IContactApiResponse {
	success: boolean;
	message?: string;
}

export async function submitContactForm(payload: IContactFormPayload): Promise<void> {
	const apiUrl = getApiUrl();
	const locale = getCurrentLang();

	const response = await fetch(`${apiUrl}/contact`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Locale': locale,
		},
		body: JSON.stringify({
			...payload,
			locale,
		}),
		signal: AbortSignal.timeout(15000),
	});

	const body = (await response.json()) as IContactApiResponse;

	if (!response.ok || !body.success) {
		throw new Error(body.message || 'Contact form submission failed');
	}
}
