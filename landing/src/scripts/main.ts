import { submitContactForm } from '../lib/contact-api';

function initContactForm() {
	const form = document.getElementById('contact-form') as HTMLFormElement | null;
	const status = document.getElementById('contact-form-status');
	const submitButton = form?.querySelector(
		'[data-testid="contact-submit"]',
	) as HTMLButtonElement | null;

	if (!form) return;

	const successMessage = form.dataset.successMessage ?? '';
	const errorMessage = form.dataset.errorMessage ?? '';
	const sendingMessage = form.dataset.sendingMessage ?? '';
	const defaultSubmitLabel = submitButton?.querySelector('span')?.textContent ?? '';

	const setStatus = (message: string, isError = false) => {
		if (!status) return;
		status.textContent = message;
		status.classList.toggle('text-emerald-600', !isError);
		status.classList.toggle('text-red-600', isError);
		status.classList.remove('hidden');
	};

	const setSubmitting = (submitting: boolean) => {
		if (submitButton) {
			submitButton.disabled = submitting;
			const label = submitButton.querySelector('span');
			if (label && defaultSubmitLabel) {
				label.textContent = submitting ? sendingMessage : defaultSubmitLabel;
			}
		}
	};

	form.addEventListener('submit', (e) => {
		e.preventDefault();

		const formData = new FormData(form);
		const name = String(formData.get('name') ?? '').trim();
		const phone = String(formData.get('phone') ?? '').trim();
		const task = String(formData.get('task') ?? '').trim();

		if (!name || !phone || !task) return;

		setSubmitting(true);
		if (sendingMessage) {
			setStatus(sendingMessage);
		}

		void submitContactForm({ name, phone, task })
			.then(() => {
				if (successMessage) {
					setStatus(successMessage);
				}
				form.reset();
			})
			.catch(() => {
				if (errorMessage) {
					setStatus(errorMessage, true);
				}
			})
			.finally(() => {
				setSubmitting(false);
			});
	});
}

function initFooterLogo() {
	const btn = document.getElementById('footer-logo');
	if (!btn) return;

	btn.addEventListener('click', () => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	});
}

function init() {
	initContactForm();
	initFooterLogo();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}

export {};
