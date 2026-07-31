const overlay = () => document.getElementById('modal-overlay');
const modalContent = () => document.getElementById('modal-content');

export function openModal(prefillTask?: string): void {
	const el = overlay();
	if (!el) return;

	if (prefillTask) {
		const textarea = el.querySelector('textarea');
		if (textarea instanceof HTMLTextAreaElement && !textarea.value.trim()) {
			textarea.value = prefillTask;
		}
	}

	el.classList.add('open');
	document.body.style.overflow = 'hidden';
}

export function closeModal(): void {
	const el = overlay();
	if (!el) return;
	el.classList.remove('open');
	document.body.style.overflow = '';
}

function handleOverlayClick(e: MouseEvent): void {
	if (e.target === overlay()) closeModal();
}

function handleSubmit(e: Event): void {
	e.preventDefault();
	const content = modalContent();
	if (!content) return;

	content.innerHTML = `
		<div class="form-success">
			<div class="form-success-icon">✅</div>
			<h3>Заявка отправлена!</h3>
			<p style="margin-top:12px; color: var(--text-muted);">
				Мы свяжемся с вами в Telegram в течение нескольких часов. Если хотите быстрее — напишите сами:
				<a href="https://t.me/dobrosvet_dev" style="color: var(--accent-hover);">@dobrosvet_dev</a>
			</p>
		</div>
	`;

	setTimeout(closeModal, 4000);
}

export function initModal(): void {
	const el = overlay();
	if (!el) return;

	el.addEventListener('click', handleOverlayClick);

	const closeBtn = el.querySelector('.modal-close');
	if (closeBtn) closeBtn.addEventListener('click', () => closeModal());

	const form = el.querySelector('form');
	if (form) form.addEventListener('submit', handleSubmit);

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') closeModal();
	});

	document.querySelectorAll('[data-open-modal]').forEach((btn) => {
		btn.addEventListener('click', () => openModal());
	});
}

(window as Window & { openModal?: typeof openModal }).openModal = openModal;
(window as Window & { closeModal?: typeof closeModal }).closeModal = closeModal;
