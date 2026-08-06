import { submitHeroChat, initHeroChat } from "./hero-chat";

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";
const PROMPT_ANIMATION_NAME = "hero-input-prompt-glow";

let dismissInputPrompt: (() => void) | null = null;

function getPromptAnimationMs(inputBar: HTMLElement): number {
  const style = getComputedStyle(inputBar);
  const durationSec =
    parseFloat(style.getPropertyValue("--prompt-duration")) || 1.4;
  const iterations =
    Number.parseInt(style.getPropertyValue("--prompt-iterations"), 10) || 2;
  return durationSec * iterations * 1000;
}

function clearHeroInputPrompt(inputBar: HTMLElement) {
  dismissInputPrompt?.();
  dismissInputPrompt = null;
  inputBar.classList.remove("hero-input-prompt");
}

function initHeroInput() {
  const input = document.getElementById(
    "hero-input",
  ) as HTMLInputElement | null;
  const submit = document.getElementById("hero-submit");

  submit?.addEventListener("click", () => {
    submitHeroChat(input?.value ?? "");
  });

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitHeroChat(input.value);
    }
  });
}

function promptHeroInput(inputBar: HTMLElement, input: HTMLInputElement) {
  clearHeroInputPrompt(inputBar);
  void inputBar.offsetWidth;
  inputBar.classList.add("hero-input-prompt");

  input.scrollIntoView({ behavior: "smooth", block: "nearest" });
  input.focus({ preventScroll: true });

  const onAnimationEnd = (event: AnimationEvent) => {
    if (event.animationName !== PROMPT_ANIMATION_NAME) return;
    clearHeroInputPrompt(inputBar);
  };

  inputBar.addEventListener("animationend", onAnimationEnd);

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    timeoutId = setTimeout(
      () => clearHeroInputPrompt(inputBar),
      getPromptAnimationMs(inputBar),
    );
  }

  dismissInputPrompt = () => {
    inputBar.removeEventListener("animationend", onAnimationEnd);
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  };
}

let crystalSphereLoaded = false;

function loadCrystalSphere() {
  if (crystalSphereLoaded) return;
  crystalSphereLoaded = true;

  void import("./crystal-sphere").then(({ initCrystalSphere }) => {
    initCrystalSphere();
  });
}

function scheduleCrystalSphere(mediaQuery: MediaQueryList) {
  if (!mediaQuery.matches) return;

  const run = () => loadCrystalSphere();

  if ("requestIdleCallback" in window) {
    requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 1);
  }
}

function initCrystalSphereLazy() {
  const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);

  scheduleCrystalSphere(mediaQuery);

  mediaQuery.addEventListener("change", (event) => {
    if (event.matches) {
      scheduleCrystalSphere(mediaQuery);
    }
  });
}

async function initHeroVoice() {
  const heroInput = document.getElementById(
    "hero-input",
  ) as HTMLInputElement | null;
  const heroInputBar = document.getElementById("hero-input-bar");
  const micButton = document.getElementById(
    "hero-mic-btn",
  ) as HTMLButtonElement | null;
  const voiceStatus = document.getElementById("hero-voice-status");

  if (!heroInput || !micButton) return;

  const { initHeroVoiceInput } = await import("./voice-transcription");

  initHeroVoiceInput({
    input: heroInput,
    micButton,
    status: voiceStatus,
  });

  heroInput.addEventListener("input", () => {
    if (heroInputBar) clearHeroInputPrompt(heroInputBar);
  });

  heroInput.addEventListener("focus", () => {
    window.setHeroState?.("INPUT_FOCUS");
  });

  heroInput.addEventListener("blur", () => {
    window.setHeroState?.("AMBIENT");
  });
}

function initSphereTrigger() {
  const sphereTrigger = document.getElementById("sphere-trigger");
  const heroInput = document.getElementById(
    "hero-input",
  ) as HTMLInputElement | null;
  const heroInputBar = document.getElementById("hero-input-bar");
  const robotBubble = document.getElementById("robot-bubble");

  sphereTrigger?.addEventListener("click", () => {
    if (!heroInput || !heroInputBar) return;

    robotBubble?.classList.add("force-show");
    window.setTimeout(() => {
      robotBubble?.classList.remove("force-show");
    }, 2800);

    promptHeroInput(heroInputBar, heroInput);
    window.setHeroState?.("INPUT_FOCUS");
  });
}

function init() {
  initHeroInput();
  initCrystalSphereLazy();
  void initHeroVoice();
  void initHeroChat();
  initSphereTrigger();
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", init);
else init();

export {};
