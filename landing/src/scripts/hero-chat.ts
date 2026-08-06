import {
	resolveChatSession,
	sendChatMessage,
	type IChatMessage,
	type TChatRole,
} from '../lib/chat-api';
import { initVisitorSession } from '../lib/visitor';

const EXPAND_DURATION_MS = 520;
const EXPAND_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';
const ASSISTANT_REPLY_DELAY_MS = 1200;
const SHELL_BASE_CLASS = 'hero-chat-shell mt-10 mx-auto lg:mx-0 max-w-xl w-full';

let chatExpanded = false;
let isAnimating = false;
let isReplying = false;
let sessionPromise: Promise<IChatMessage[] | null> | null = null;
let collapsedTargetRect: DOMRect | null = null;

function ensureChatSession(): Promise<IChatMessage[] | null> {
	if (!sessionPromise) {
		initVisitorSession();
		sessionPromise = resolveChatSession().then((session) => session?.messages ?? null);
	}
	return sessionPromise;
}

function getAssistantReply(): string {
	return 'Спасибо за описание! Расскажите подробнее о процессе — или оставьте контакты в форме ниже, и мы разберём задачу бесплатно.';
}

function setTitlebarVisible(visible: boolean) {
	const titlebar = document.getElementById('hero-chat-titlebar');
	if (!titlebar) return;
	titlebar.hidden = !visible;
}

function getShellTransition(): string {
	return [
		`top ${EXPAND_DURATION_MS}ms ${EXPAND_EASING}`,
		`left ${EXPAND_DURATION_MS}ms ${EXPAND_EASING}`,
		`width ${EXPAND_DURATION_MS}ms ${EXPAND_EASING}`,
		`height ${EXPAND_DURATION_MS}ms ${EXPAND_EASING}`,
		`border-radius ${EXPAND_DURATION_MS}ms ${EXPAND_EASING}`,
	].join(', ');
}

function measureCollapsedShellRect(
	shell: HTMLElement,
	messagesEl: HTMLElement,
): DOMRect {
	const shellClassName = shell.className;
	const shellStyle = shell.style.cssText;
	const messagesHidden = messagesEl.hidden;
	const titlebar = document.getElementById('hero-chat-titlebar');
	const titlebarHidden = titlebar?.hidden ?? true;

	shell.className = SHELL_BASE_CLASS;
	shell.style.cssText = '';
	messagesEl.hidden = true;
	setTitlebarVisible(false);

	const rect = shell.getBoundingClientRect();

	shell.className = shellClassName;
	shell.style.cssText = shellStyle;
	messagesEl.hidden = messagesHidden;
	if (titlebar) titlebar.hidden = titlebarHidden;

	return rect;
}

function appendMessage(container: HTMLElement, role: TChatRole, text: string) {
	const message = document.createElement('div');
	message.className = `hero-chat-message hero-chat-message--${role}`;
	message.textContent = text;
	container.appendChild(message);
	container.scrollTop = container.scrollHeight;
}

function renderMessages(container: HTMLElement, messages: IChatMessage[]) {
	container.replaceChildren();
	for (const message of messages) {
		appendMessage(container, message.role, message.text);
	}
}

async function showAssistantReply(messagesEl: HTMLElement) {
	if (isReplying) return;
	isReplying = true;

	const typing = document.createElement('div');
	typing.className = 'hero-chat-message hero-chat-message--assistant hero-chat-typing';
	typing.setAttribute('aria-hidden', 'true');
	typing.innerHTML = '<span></span><span></span><span></span>';
	messagesEl.appendChild(typing);
	messagesEl.scrollTop = messagesEl.scrollHeight;

	await new Promise((resolve) => setTimeout(resolve, ASSISTANT_REPLY_DELAY_MS));

	typing.remove();
	const reply = getAssistantReply();
	appendMessage(messagesEl, 'assistant', reply);
	void sendChatMessage('assistant', reply);
	isReplying = false;
}

function finishExpand(
	shell: HTMLElement,
	messagesEl: HTMLElement,
	heroInner: HTMLElement,
) {
	shell.classList.remove('hero-chat-shell--animating');
	shell.classList.add('hero-chat-shell--expanded');
	shell.style.cssText = '';
	messagesEl.hidden = false;
	heroInner.style.minHeight = '';
	setTitlebarVisible(true);
	isAnimating = false;
}

function finishCollapse(
	shell: HTMLElement,
	messagesEl: HTMLElement,
	heroInner: HTMLElement,
) {
	shell.classList.remove('hero-chat-shell--animating', 'hero-chat-shell--expanded');
	shell.style.cssText = '';
	messagesEl.hidden = true;
	heroInner.style.minHeight = '';
	setTitlebarVisible(false);
	isAnimating = false;
	collapsedTargetRect = shell.getBoundingClientRect();
}

function expandChatShell(
	shell: HTMLElement,
	messagesEl: HTMLElement,
	heroSection: HTMLElement,
	heroInner: HTMLElement,
	onComplete: () => void,
) {
	chatExpanded = true;
	isAnimating = true;
	window.setHeroState?.('WORKSPACE');

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	heroInner.style.minHeight = `${heroInner.offsetHeight}px`;

	const startRect = shell.getBoundingClientRect();
	collapsedTargetRect = startRect;
	const innerRect = heroInner.getBoundingClientRect();
	const endTop = innerRect.top;
	const endLeft = innerRect.left;
	const endWidth = innerRect.width;
	const endHeight = startRect.bottom - innerRect.top;

	messagesEl.hidden = false;
	setTitlebarVisible(true);
	heroSection.classList.add('hero-chat-active');
	shell.classList.add('hero-chat-shell--animating');

	Object.assign(shell.style, {
		position: 'fixed',
		top: `${startRect.top}px`,
		left: `${startRect.left}px`,
		width: `${startRect.width}px`,
		height: `${startRect.height}px`,
		margin: '0',
		zIndex: '50',
		borderRadius: '9999px',
	});

	if (reducedMotion) {
		finishExpand(shell, messagesEl, heroInner);
		onComplete();
		return;
	}

	const onTransitionEnd = (event: TransitionEvent) => {
		if (event.propertyName !== 'height') return;
		shell.removeEventListener('transitionend', onTransitionEnd);
		finishExpand(shell, messagesEl, heroInner);
		onComplete();
	};

	shell.addEventListener('transitionend', onTransitionEnd);

	requestAnimationFrame(() => {
		shell.style.transition = getShellTransition();
		shell.style.top = `${endTop}px`;
		shell.style.left = `${endLeft}px`;
		shell.style.width = `${endWidth}px`;
		shell.style.height = `${endHeight}px`;
		shell.style.borderRadius = '1.25rem';
	});
}

function collapseChatShell() {
	if (!chatExpanded || isAnimating) return;

	const shell = document.getElementById('hero-chat-shell');
	const messagesEl = document.getElementById('hero-chat-messages');
	const heroSection = document.getElementById('hero');
	const heroInner = document.getElementById('hero-inner');

	if (!shell || !messagesEl || !heroSection || !heroInner) return;

	chatExpanded = false;
	isAnimating = true;
	window.setHeroState?.('AMBIENT');

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	heroInner.style.minHeight = `${heroInner.offsetHeight}px`;

	const innerRect = heroInner.getBoundingClientRect();
	const startTop = innerRect.top;
	const startLeft = innerRect.left;
	const startWidth = innerRect.width;
	const startHeight = shell.getBoundingClientRect().bottom - innerRect.top;

	const endRect =
		collapsedTargetRect ?? measureCollapsedShellRect(shell, messagesEl);

	heroSection.classList.remove('hero-chat-active');
	shell.classList.remove('hero-chat-shell--expanded');
	shell.classList.add('hero-chat-shell--animating');
	messagesEl.hidden = true;
	setTitlebarVisible(false);

	Object.assign(shell.style, {
		position: 'fixed',
		top: `${startTop}px`,
		left: `${startLeft}px`,
		width: `${startWidth}px`,
		height: `${startHeight}px`,
		margin: '0',
		zIndex: '50',
		borderRadius: '1.25rem',
		transition: 'none',
	});

	if (reducedMotion) {
		finishCollapse(shell, messagesEl, heroInner);
		return;
	}

	const onTransitionEnd = (event: TransitionEvent) => {
		if (event.propertyName !== 'height') return;
		shell.removeEventListener('transitionend', onTransitionEnd);
		finishCollapse(shell, messagesEl, heroInner);
	};

	shell.addEventListener('transitionend', onTransitionEnd);

	requestAnimationFrame(() => {
		shell.style.transition = getShellTransition();
		shell.style.top = `${endRect.top}px`;
		shell.style.left = `${endRect.left}px`;
		shell.style.width = `${endRect.width}px`;
		shell.style.height = `${endRect.height}px`;
		shell.style.borderRadius = '9999px';
	});
}

function expandChatIfNeeded(messagesEl: HTMLElement) {
	if (chatExpanded || messagesEl.childElementCount === 0) return;

	const shell = document.getElementById('hero-chat-shell');
	const heroSection = document.getElementById('hero');
	const heroInner = document.getElementById('hero-inner');

	if (!shell || !heroSection || !heroInner) return;

	chatExpanded = true;
	window.setHeroState?.('WORKSPACE');
	messagesEl.hidden = false;
	setTitlebarVisible(true);
	heroSection.classList.add('hero-chat-active');
	shell.classList.add('hero-chat-shell--expanded');
	collapsedTargetRect = measureCollapsedShellRect(shell, messagesEl);
}

function expandChatOnInputFocus() {
	if (chatExpanded || isAnimating) return;

	const shell = document.getElementById('hero-chat-shell');
	const messagesEl = document.getElementById('hero-chat-messages');
	const heroSection = document.getElementById('hero');
	const heroInner = document.getElementById('hero-inner');

	if (!shell || !messagesEl || !heroSection || !heroInner) return;
	if (messagesEl.childElementCount === 0) return;

	expandChatShell(shell, messagesEl, heroSection, heroInner, () => {});
}

export async function initHeroChat(): Promise<void> {
	const messagesEl = document.getElementById('hero-chat-messages');
	if (!messagesEl) return;

	document
		.getElementById('hero-chat-minimize')
		?.addEventListener('click', collapseChatShell);

	document
		.getElementById('hero-input')
		?.addEventListener('focus', expandChatOnInputFocus);

	const messages = await ensureChatSession();
	if (!messages?.length) return;

	renderMessages(messagesEl, messages);
	expandChatIfNeeded(messagesEl);
}

export function submitHeroChat(message: string): boolean {
	const trimmed = message.trim();
	if (!trimmed) return false;

	const shell = document.getElementById('hero-chat-shell');
	const messagesEl = document.getElementById('hero-chat-messages');
	const heroSection = document.getElementById('hero');
	const heroInner = document.getElementById('hero-inner');
	const input = document.getElementById('hero-input') as HTMLInputElement | null;
	const inputBar = document.getElementById('hero-input-bar');

	if (!shell || !messagesEl || !heroSection || !heroInner) return false;

	if (inputBar) {
		inputBar.classList.remove('hero-input-prompt');
	}

	appendMessage(messagesEl, 'user', trimmed);
	void ensureChatSession().then(() => sendChatMessage('user', trimmed));

	if (input) {
		input.value = '';
		input.focus();
	}

	const onReply = () => {
		void showAssistantReply(messagesEl);
	};

	if (!chatExpanded) {
		expandChatShell(shell, messagesEl, heroSection, heroInner, onReply);
	} else {
		onReply();
	}

	return true;
}

export function isHeroChatExpanded(): boolean {
	return chatExpanded;
}
