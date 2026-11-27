import {
	resolveChatSession,
	sendChatMessage,
	restartChatSession,
	generateSpec,
	downloadSpec,
	ChatApiError,
	type IChatMessage,
	type IChatSession,
	type ISpecResult,
	type TChatRole,
} from '../lib/chat-api';
import { getOrCreateChatId, initVisitorSession } from '../lib/visitor';
import { getChatMessages } from '../i18n/chat';
import { getCurrentLang } from '../lib/lang';

function chatMsg() {
	return getChatMessages(getCurrentLang());
}

let chatExpanded = false;
let isAnimating = false;
let isReplying = false;
let isGeneratingSpec = false;
let sessionPromise: Promise<IChatSession | null> | null = null;
let collapsedTargetRect: DOMRect | null = null;
let collapsedInnerHeight = 0;
let heroInnerResizeObserver: ResizeObserver | null = null;
let currentSession: IChatSession | null = null;
let cachedSpec: ISpecResult | null = null;
let specShownForChatId: string | null = null;

const EXPAND_DURATION_MS = 520;
const EXPAND_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';
const SHELL_BASE_CLASS = 'hero-chat-shell mt-10 mx-auto lg:mx-0 max-w-xl w-full';

function ensureChatSession(): Promise<IChatSession | null> {
	if (!sessionPromise) {
		initVisitorSession();
		sessionPromise = resolveChatSession().then((session) => {
			currentSession = session;
			return session;
		});
	}
	return sessionPromise;
}

function setTitlebarVisible(visible: boolean) {
	const titlebar = document.getElementById('hero-chat-titlebar');
	if (!titlebar) return;
	titlebar.hidden = !visible;
}

function updateDownloadButton(session: IChatSession | null) {
	const downloadButton = document.getElementById(
		'hero-chat-download',
	) as HTMLButtonElement | null;
	if (!downloadButton) return;

	const canDownload = Boolean(session?.hasSpec && cachedSpec);
	downloadButton.hidden = !canDownload;
	downloadButton.disabled = isReplying || isGeneratingSpec || !canDownload;
}

function appendSpecMessage(messagesEl: HTMLElement, specText: string) {
	const message = document.createElement('div');
	message.className =
		'hero-chat-message hero-chat-message--assistant hero-chat-message--spec';
	message.textContent = `${specText}${chatMsg().specDownloadFooter}`;
	messagesEl.appendChild(message);
	messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendSpecRetryActions(
	messagesEl: HTMLElement,
	session: IChatSession,
): void {
	const existing = messagesEl.querySelector('[data-spec-retry-actions]');
	existing?.remove();

	const actions = document.createElement('div');
	actions.className = 'hero-chat-actions';
	actions.dataset.specRetryActions = '';

	const retryButton = document.createElement('button');
	retryButton.type = 'button';
	retryButton.className = 'hero-chat-restart-btn';
	retryButton.textContent = chatMsg().specRetryButton;
	retryButton.addEventListener('click', () => {
		if (isGeneratingSpec) return;
		actions.remove();
		void maybeGenerateAndShowSpec(messagesEl, session);
	});

	actions.appendChild(retryButton);
	messagesEl.appendChild(actions);
	messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function maybeGenerateAndShowSpec(
	messagesEl: HTMLElement,
	session: IChatSession,
): Promise<void> {
	if (!session.leadComplete || !session.canGenerateSpec) return;
	if (specShownForChatId === session.chatId) return;
	if (isGeneratingSpec) return;

	isGeneratingSpec = true;
	messagesEl.querySelector('[data-spec-retry-actions]')?.remove();
	updateDownloadButton(currentSession);

	let statusMessage = messagesEl.querySelector(
		'[data-spec-status]',
	) as HTMLElement | null;

	if (!statusMessage) {
		appendMessage(messagesEl, 'assistant', chatMsg().specGenerating);
		statusMessage = messagesEl.lastElementChild as HTMLElement | null;
		statusMessage?.setAttribute('data-spec-status', '');
	} else {
		statusMessage.textContent = chatMsg().specGenerating;
	}

	try {
		const spec = await generateSpec();
		statusMessage?.remove();

		cachedSpec = spec;
		specShownForChatId = session.chatId;
		currentSession = { ...session, hasSpec: true };
		appendSpecMessage(messagesEl, spec.text);
		updateDownloadButton(currentSession);
	} catch {
		if (statusMessage instanceof HTMLElement) {
			statusMessage.textContent = chatMsg().specFailed;
		} else {
			appendErrorMessage(messagesEl, chatMsg().specFailed);
		}
		appendSpecRetryActions(messagesEl, session);
	} finally {
		isGeneratingSpec = false;
		updateDownloadButton(currentSession);
	}
}

function handleDownloadSpec() {
	if (!cachedSpec) return;
	downloadSpec(cachedSpec.text, getOrCreateChatId());
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

function captureCollapsedInnerHeight(heroInner: HTMLElement): void {
	collapsedInnerHeight = heroInner.offsetHeight;
}

function pinHeroInnerHeight(heroInner: HTMLElement): void {
	if (collapsedInnerHeight <= 0) {
		captureCollapsedInnerHeight(heroInner);
	}
	heroInner.style.minHeight = `${collapsedInnerHeight}px`;
}

function releaseHeroInnerHeight(heroInner: HTMLElement): void {
	heroInner.style.minHeight = '';
	captureCollapsedInnerHeight(heroInner);
}

function observeHeroInnerHeight(): void {
	const heroInner = document.getElementById('hero-inner');
	if (!heroInner || heroInnerResizeObserver) return;

	heroInnerResizeObserver = new ResizeObserver(() => {
		if (!chatExpanded && !isAnimating) {
			captureCollapsedInnerHeight(heroInner);
		}
	});
	heroInnerResizeObserver.observe(heroInner);
	captureCollapsedInnerHeight(heroInner);
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

function showTypingIndicator(messagesEl: HTMLElement): HTMLElement {
	const typing = document.createElement('div');
	typing.className = 'hero-chat-message hero-chat-message--assistant hero-chat-typing';
	typing.setAttribute('aria-hidden', 'true');
	typing.innerHTML = '<span></span><span></span><span></span>';
	messagesEl.appendChild(typing);
	messagesEl.scrollTop = messagesEl.scrollHeight;
	return typing;
}

function appendErrorMessage(messagesEl: HTMLElement, text: string) {
	appendMessage(messagesEl, 'assistant', text);
}

function resetSessionState() {
	sessionPromise = null;
	currentSession = null;
	cachedSpec = null;
	specShownForChatId = null;
}

function showLeadCompletePrompt(
	messagesEl: HTMLElement,
	pendingMessage?: string,
	canStartNewProject = true,
) {
	appendMessage(
		messagesEl,
		'assistant',
		canStartNewProject ? chatMsg().leadComplete : chatMsg().leadCompleteLimit,
	);

	if (!canStartNewProject) {
		messagesEl.scrollTop = messagesEl.scrollHeight;
		return;
	}

	const actions = document.createElement('div');
	actions.className = 'hero-chat-actions';

	const restartButton = document.createElement('button');
	restartButton.type = 'button';
	restartButton.className = 'hero-chat-restart-btn';
	restartButton.textContent = chatMsg().restartButton;
	restartButton.addEventListener('click', () => {
		void handleStartNewApplication(messagesEl, pendingMessage);
	});

	actions.appendChild(restartButton);
	messagesEl.appendChild(actions);
	messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function handleStartNewApplication(
	messagesEl: HTMLElement,
	pendingMessage?: string,
) {
	if (isReplying) return;

	isReplying = true;
	updateDownloadButton(currentSession);

	const typing = showTypingIndicator(messagesEl);

	try {
		const session = await restartChatSession();
		typing.remove();

		resetSessionState();
		currentSession = session;
		sessionPromise = Promise.resolve(session);

		messagesEl.replaceChildren();
		updateDownloadButton(session);

		isReplying = false;
		updateDownloadButton(currentSession);

		if (pendingMessage) {
			appendMessage(messagesEl, 'user', pendingMessage);
			await requestAssistantReply(messagesEl, pendingMessage);
			return;
		}
	} catch (error) {
		typing.remove();

		if (error instanceof ChatApiError && error.code === 'PROJECT_LIMIT_REACHED') {
			appendErrorMessage(messagesEl, error.message || chatMsg().projectLimit);
			return;
		}

		appendErrorMessage(messagesEl, chatMsg().restartFailed);
	} finally {
		isReplying = false;
		updateDownloadButton(currentSession);
	}
}

async function requestAssistantReply(
	messagesEl: HTMLElement,
	userText: string,
): Promise<void> {
	if (isReplying) return;
	isReplying = true;
	updateDownloadButton(currentSession);

	const typing = showTypingIndicator(messagesEl);

	try {
		await ensureChatSession();
		const session = await sendChatMessage(userText);
		typing.remove();

		if (!session) {
			appendErrorMessage(messagesEl, chatMsg().replyFailed);
			return;
		}

		currentSession = session;
		renderMessages(messagesEl, session.messages);
		updateDownloadButton(session);

		if (session.leadComplete) {
			await maybeGenerateAndShowSpec(messagesEl, session);
		}
	} catch (error) {
		typing.remove();

		if (error instanceof ChatApiError && error.code === 'LEAD_COMPLETE') {
			const canStartNewProject =
				error.canStartNewProject ??
				currentSession?.canStartNewProject ??
				true;
			showLeadCompletePrompt(messagesEl, userText, canStartNewProject);

			if (currentSession?.hasSpec) {
				await maybeGenerateAndShowSpec(messagesEl, {
					...currentSession,
					leadComplete: true,
					canGenerateSpec: true,
				});
			}

			return;
		}

		appendErrorMessage(messagesEl, chatMsg().aiReplyFailed);
	} finally {
		isReplying = false;
		updateDownloadButton(currentSession);
	}
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
	pinHeroInnerHeight(heroInner);
	setTitlebarVisible(true);
	isAnimating = false;
	updateDownloadButton(currentSession);
}

function finishCollapse(
	shell: HTMLElement,
	messagesEl: HTMLElement,
	heroInner: HTMLElement,
) {
	shell.classList.remove('hero-chat-shell--animating', 'hero-chat-shell--expanded');
	shell.style.cssText = '';
	messagesEl.hidden = true;
	releaseHeroInnerHeight(heroInner);
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
	captureCollapsedInnerHeight(heroInner);
	pinHeroInnerHeight(heroInner);

	const startRect = shell.getBoundingClientRect();
	collapsedTargetRect = startRect;
	const innerRect = heroInner.getBoundingClientRect();
	const endTop = innerRect.top;
	const endLeft = innerRect.left;
	const endWidth = innerRect.width;
	const endHeight = collapsedInnerHeight;

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
	pinHeroInnerHeight(heroInner);

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

	captureCollapsedInnerHeight(heroInner);
	pinHeroInnerHeight(heroInner);

	chatExpanded = true;
	window.setHeroState?.('WORKSPACE');
	messagesEl.hidden = false;
	setTitlebarVisible(true);
	heroSection.classList.add('hero-chat-active');
	shell.classList.add('hero-chat-shell--expanded');
	collapsedTargetRect = measureCollapsedShellRect(shell, messagesEl);
	updateDownloadButton(currentSession);
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

	observeHeroInnerHeight();

	document
		.getElementById('hero-chat-minimize')
		?.addEventListener('click', collapseChatShell);

	document
		.getElementById('hero-input')
		?.addEventListener('focus', expandChatOnInputFocus);

	document
		.getElementById('hero-chat-download')
		?.addEventListener('click', handleDownloadSpec);

	const session = await ensureChatSession();
	if (!session?.messages.length) {
		updateDownloadButton(session);
		return;
	}

	renderMessages(messagesEl, session.messages);
	expandChatIfNeeded(messagesEl);
	updateDownloadButton(session);

	if (session.leadComplete) {
		await maybeGenerateAndShowSpec(messagesEl, session);
	}
}

export function submitHeroChat(message: string): boolean {
	const trimmed = message.trim();
	if (!trimmed || isReplying) return false;

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

	if (input) {
		input.value = '';
		input.focus();
	}

	const onReply = () => {
		void requestAssistantReply(messagesEl, trimmed);
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
