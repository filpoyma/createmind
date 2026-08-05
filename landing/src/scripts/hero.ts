const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';
const HERO_INPUT_PROMPT_MS = 4200;

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

	submit?.addEventListener('click', () => {
		scrollToContact(input?.value.trim() || undefined);
	});

	input?.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			scrollToContact(input.value.trim() || undefined);
		}
	});
}

function promptHeroInput(inputBar: HTMLElement, input: HTMLInputElement) {
	inputBar.classList.remove('hero-input-prompt');
	void inputBar.offsetWidth;
	inputBar.classList.add('hero-input-prompt');

	input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	input.focus({ preventScroll: true });

	window.setTimeout(() => {
		inputBar.classList.remove('hero-input-prompt');
	}, HERO_INPUT_PROMPT_MS);
}

let crystalSphereLoaded = false;

function loadCrystalSphere() {
	if (crystalSphereLoaded) return;
	crystalSphereLoaded = true;

	void import('./crystal-sphere').then(({ initCrystalSphere }) => {
		initCrystalSphere();
	});
}

function scheduleCrystalSphere(mediaQuery: MediaQueryList) {
	if (!mediaQuery.matches) return;

	const run = () => loadCrystalSphere();

	if ('requestIdleCallback' in window) {
		requestIdleCallback(run, { timeout: 2000 });
	} else {
		setTimeout(run, 1);
	}
}

function initCrystalSphereLazy() {
	const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);

	scheduleCrystalSphere(mediaQuery);

	mediaQuery.addEventListener('change', (event) => {
		if (event.matches) {
			scheduleCrystalSphere(mediaQuery);
		}
	});
}

async function initHeroVoice() {
	const heroInput = document.getElementById('hero-input') as HTMLInputElement | null;
	const heroInputBar = document.getElementById('hero-input-bar');
	const micButton = document.getElementById('hero-mic-btn') as HTMLButtonElement | null;
	const voiceStatus = document.getElementById('hero-voice-status');

	if (!heroInput || !micButton) return;

	const { initHeroVoiceInput } = await import('./voice-transcription');

	initHeroVoiceInput({
		input: heroInput,
		micButton,
		status: voiceStatus,
	});

	heroInput.addEventListener('input', () => {
		heroInputBar?.classList.remove('hero-input-prompt');
	});

	heroInput.addEventListener('focus', () => {
		window.setHeroState?.('INPUT_FOCUS');
	});

	heroInput.addEventListener('blur', () => {
		window.setHeroState?.('AMBIENT');
	});
}

function initSphereTrigger() {
	const sphereTrigger = document.getElementById('sphere-trigger');
	const heroInput = document.getElementById('hero-input') as HTMLInputElement | null;
	const heroInputBar = document.getElementById('hero-input-bar');
	const robotBubble = document.getElementById('robot-bubble');

	sphereTrigger?.addEventListener('click', () => {
		if (!heroInput || !heroInputBar) return;

		robotBubble?.classList.add('force-show');
		window.setTimeout(() => {
			robotBubble?.classList.remove('force-show');
		}, 2800);

		promptHeroInput(heroInputBar, heroInput);
		window.setHeroState?.('INPUT_FOCUS');
	});
}

function init() {
	initHeroInput();
	initCrystalSphereLazy();
	void initHeroVoice();
	initSphereTrigger();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
