function initContactForm() {
	const form = document.getElementById('contact-form') as HTMLFormElement | null;
	const status = document.getElementById('contact-form-status');
	if (!form) return;

	form.addEventListener('submit', (e) => {
		e.preventDefault();
		if (status) {
			status.classList.remove('hidden');
			status.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.';
		}
		form.reset();
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
