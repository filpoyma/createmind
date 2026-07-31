function initMobileMenu() {
	const btn = document.getElementById('mobile-menu-btn');
	const menu = document.getElementById('mobile-menu');
	if (!btn || !menu) return;

	btn.addEventListener('click', () => {
		const isOpen = !menu.classList.contains('hidden');
		menu.classList.toggle('hidden', isOpen);
		btn.setAttribute('aria-expanded', String(!isOpen));
	});

	menu.querySelectorAll('a').forEach((link) => {
		link.addEventListener('click', () => {
			menu.classList.add('hidden');
			btn.setAttribute('aria-expanded', 'false');
		});
	});
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

function initContactForm() {
	const form = document.getElementById('contact-form') as HTMLFormElement | null;
	const status = document.getElementById('contact-form-status');
	if (!form || !status) return;

	form.addEventListener('submit', (e) => {
		e.preventDefault();
		status.classList.remove('hidden');
		status.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.';
		status.className = 'text-sm text-emerald-600';
		form.reset();
	});
}

function init() {
	initMobileMenu();
	initHeroInput();
	initContactForm();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
