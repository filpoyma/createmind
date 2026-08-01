function initHeroInput() {
	const input = document.getElementById('hero-input') as HTMLInputElement | null;
	const submit = document.getElementById('hero-submit');
	const mic = document.getElementById('hero-mic-btn');

	if (submit) {
		submit.addEventListener('click', () => {
			scrollToContact(input?.value.trim() || undefined);
		});
	}

	if (input) {
		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				scrollToContact(input.value.trim() || undefined);
			}
		});
	}

	if (mic) {
		mic.addEventListener('click', () => scrollToContact());
	}
}

function scrollToContact(prefillTask?: string) {
	const contact = document.getElementById('contact');
	const taskField = document.getElementById('contact-task') as HTMLTextAreaElement | null;
	if (prefillTask && taskField) {
		taskField.value = prefillTask;
	}
	contact?.scrollIntoView({ behavior: 'smooth' });
	taskField?.focus();
}

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
	initHeroInput();
	initContactForm();
	initFooterLogo();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
