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

const EXPAND_DURATION_MS = 520;
const EXPAND_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';
const SHELL_BASE_CLASS = 'hero-chat-shell mt-10 mx-auto lg:mx-0 max-w-xl w-full';
const LEAD_COMPLETE_MESSAGE =
	'Эта заявка уже завершена — мы собрали все данные по текущему проекту. Если у вас новая задача, начните отдельную заявку: история чата обнулится. ТЗ по текущему проекту можно скачать по кнопке «Скачать ТЗ» справа вверху чата.';
const LEAD_COMPLETE_LIMIT_MESSAGE =
	'Эта заявка уже завершена. Вы достигли лимита в 3 проекта. ТЗ по текущему проекту можно скачать по кнопке «Скачать ТЗ» справа вверху чата.';
const PROJECT_LIMIT_MESSAGE =
	'Достигнут лимит: один пользователь может оформить не более 3 проектов.';
const SPEC_DOWNLOAD_FOOTER =
	'\n\n—\nСкачать файл можно по кнопке «Скачать ТЗ» справа вверху чата.';
const SPEC_GENERATING_MESSAGE = 'Формирую ТЗ...';

let chatExpanded = false;
let isAnimating = false;
let isReplying = false;
let sessionPromise: Promise<IChatSession | null> | null = null;
let collapsedTargetRect: DOMRect | null = null;
let currentSession: IChatSession | null = null;
let cachedSpec: ISpecResult | null = null;
let specShownForChatId: string | null = null;

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
	downloadButton.disabled = isReplying || !canDownload;
}

function appendSpecMessage(messagesEl: HTMLElement, specText: string) {
	const message = document.createElement('div');
	message.className =
		'hero-chat-message hero-chat-message--assistant hero-chat-message--spec';
	message.textContent = `${specText}${SPEC_DOWNLOAD_FOOTER}`;
	messagesEl.appendChild(message);
	messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function maybeGenerateAndShowSpec(
	messagesEl: HTMLElement,
	session: IChatSession,
): Promise<void> {
	if (!session.leadComplete || !session.canGenerateSpec) return;
	if (specShownForChatId === session.chatId) return;

	updateDownloadButton(currentSession);

	const showGeneratingStatus = !session.hasSpec;
	let statusMessage: Element | null = null;

	if (showGeneratingStatus) {
		appendMessage(messagesEl, 'assistant', SPEC_GENERATING_MESSAGE);
		statusMessage = messagesEl.lastElementChild;
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
			statusMessage.textContent = 'Не удалось сформировать ТЗ. Попробуйте ещё раз.';
		} else {
			appendErrorMessage(messagesEl, 'Не удалось сформировать ТЗ. Попробуйте ещё раз.');
		}
	}
}

function handleDownloadSpec() {
	if (!cachedSpec) return;
	downloadSpec(cachedSpec.text, cachedSpec.json, getOrCreateChatId());
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
		canStartNewProject ? LEAD_COMPLETE_MESSAGE : LEAD_COMPLETE_LIMIT_MESSAGE,
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
	restartButton.textContent = 'Начать новую заявку';
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
			appendErrorMessage(messagesEl, error.message || PROJECT_LIMIT_MESSAGE);
			return;
		}

		appendErrorMessage(
			messagesEl,
			'Не удалось начать новую заявку. Попробуйте ещё раз.',
		);
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
			appendErrorMessage(
				messagesEl,
				'Не удалось получить ответ. Проверьте соединение и попробуйте ещё раз.',
			);
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

		appendErrorMessage(
			messagesEl,
			'Не удалось получить ответ AI. Попробуйте ещё раз через несколько секунд.',
		);
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
	heroInner.style.minHeight = '';
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
