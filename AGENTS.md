# CreateMind Astro Frontend — Agent Guide

This document describes the **CreateMind** marketing site in the `astro/` package: what it is, how it is structured, and how to work on it safely. Read this before making changes.

---

## Project overview

**CreateMind** is a static marketing landing page for an AI automation consultancy (Russian market, bilingual RU/EN). It explains services, use cases, and a before/after narrative, and collects leads through a contact modal.

This Astro app is a **frontend-only** port of the legacy site in `../v3/`:

| Source | Role |
|--------|------|
| `v3/index.html` | Page structure, inline CSS, section content, modal markup |
| `v3/app.js` (partial) | Crystal-sphere canvas animation (`#crystal-canvas`), hero input behaviour |

**Not ported** (by design — backend or different product surface):

- Telegram WebApp SDK and mini-app UI
- Chat widget, workspace, AI Architect, discovery API (`/api/discovery`)
- Lead submission to a server (`server.js`, bot integrations)
- `v3/style.css` (separate Telegram-themed stylesheet; unused by the landing HTML)

The site is built as **static HTML** (SSG) via Astro 7. No SSR adapter, no API routes, no framework islands (React/Vue/Svelte).

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | [Astro](https://docs.astro.build) 7.x |
| Output | Static (`astro build` → `dist/`) |
| Language | TypeScript for client scripts; `.astro` for templates |
| Styling | Single global CSS file with CSS custom properties |
| Fonts | Google Fonts — Outfit (headings), Inter (body) |
| Runtime | Vanilla DOM APIs; canvas 2D for the hero sphere |
| Package manager | pnpm |
| Node | `>=22.12.0` |

---

## High-level architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Astro SSG (build time)                                     │
│  pages/index.astro → composes section components            │
│  BaseLayout.astro → HTML shell, meta, global CSS import     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ static HTML + bundled JS
┌─────────────────────────────────────────────────────────────┐
│  Browser (client)                                           │
│  main.ts → i18n, modal, hero-input, crystal-sphere         │
│  lang.ts → RU/EN state + localStorage                       │
└─────────────────────────────────────────────────────────────┘
```

**Principles:**

1. **Server-first content** — Sections are plain Astro components; no client JS required for reading the page.
2. **Thin client layer** — One entry script (`main.ts`) wires interactivity after `DOMContentLoaded`.
3. **Attribute-driven i18n** — Translatable strings live in HTML via `data-translate` / `data-translate-html` / `data-translate-placeholder`, not in a large JSON catalog (except canvas speech bubbles inside `crystal-sphere.ts`).
4. **No UI framework** — Keeps bundle small and matches the legacy vanilla JS approach.

---

## Directory structure

```
astro/
├── astro.config.mjs          # Default static config (no adapter)
├── package.json
├── public/                   # Copied as-is to dist (favicon.svg, etc.)
├── src/
│   ├── pages/
│   │   └── index.astro       # Home route — assembles all sections
│   ├── layouts/
│   │   └── BaseLayout.astro  # Document shell, fonts, global styles, main.ts
│   ├── components/           # Page sections (mostly static markup)
│   │   Nav.astro
│   │   Hero.astro            # Hero copy + ChatGPT-style input + sphere mount
│   │   TrustBar.astro
│   │   Cases.astro           # Automation use-case cards
│   │   Compare.astro         # Before / after columns
│   │   HowItWorks.astro      # Process steps
│   │   CtaSection.astro      # Bottom CTA + Telegram link
│   │   Footer.astro
│   │   ContactModal.astro    # Lead form overlay (frontend-only submit)
│   ├── styles/
│   │   └── global.css        # Design tokens, layout, components, responsive
│   ├── lib/
│   │   └── lang.ts           # Language types, storage, window globals for canvas
│   └── scripts/              # Client-side TypeScript (bundled by Vite)
│       ├── main.ts           # App bootstrap
│       ├── i18n.ts           # Language toggle + DOM translation
│       ├── modal.ts          # Contact modal open/close/submit
│       ├── hero-input.ts     # Hero field, voice, send → open modal
│       └── crystal-sphere.ts # Canvas animation (~1000 lines, from legacy app.js)
└── dist/                     # Production build output
```

Unused scaffold assets (`src/assets/astro.svg`, `background.svg`) can be removed if not referenced.

---

## Page composition

`src/pages/index.astro` renders a single long-form landing in this order:

| Order | Component | Purpose |
|-------|-----------|---------|
| 1 | `Nav` | Logo, RU/EN toggle, “Discuss project” CTA |
| 2 | `Hero` | Headline, subtitle, task input (text + mic + send), interactive sphere |
| 3 | `TrustBar` | Trust bullets (launch time, data, integrations, market) |
| 4 | `Cases` | Six automation scenario cards |
| 5 | `Compare` | “Now” vs “After CreateMind” lists |
| 6 | `HowItWorks` | Four-step process |
| 7 | `CtaSection` | Final CTA button + Telegram link |
| 8 | `Footer` | Copyright |
| 9 | `ContactModal` | Overlay form (not in tab order until opened) |

All sections are siblings under `BaseLayout`; there is no nested layout per section.

---

## Layout and styling

### `BaseLayout.astro`

- Sets default `title` and `meta description` (Russian defaults).
- Loads Google Fonts and favicon.
- Imports `global.css` via `<style is:global>` (Astro pattern for global styles).
- Loads `../scripts/main.ts` as a processed module script (TypeScript → bundled JS).

Optional props: `title`, `description` — pass from pages if you add more routes later.

### `global.css`

- **Design tokens** in `:root` (`--bg`, `--accent`, `--text-muted`, etc.) with `prefers-color-scheme: light` overrides.
- **Component classes** mirror legacy naming: `.hero`, `.case-card`, `.modal-overlay`, `.chatgpt-input-container`, `.sphere-wrapper-col`, etc.
- **Responsive** breakpoints at 768px and 480px (hero/sphere sizing, grids).
- **Toast** styles for lightweight client notifications (`hero-input.ts`).

Prefer extending existing classes over introducing a new CSS methodology (no Tailwind in this project).

---

## Client scripts

### Bootstrap — `main.ts`

Runs on `DOMContentLoaded` (or immediately if DOM ready):

1. `initI18n()` — apply saved language
2. `initModal()` — overlay, form, Escape key, `[data-open-modal]` buttons
3. `initHeroInput()` — hero field, speech recognition, send → `openModal(prefill)`
4. `initCrystalSphere()` — canvas loop
5. Click on `#sphere-trigger` → `openModal()`

### Internationalization — `i18n.ts` + `lib/lang.ts`

**Supported languages:** `ru` (default content), `en`.

**Persistence:** `localStorage` key `preferred-lang`. If missing, browser languages are inspected (`ru*` → Russian, else English).

**DOM attributes:**

| Attribute | Effect |
|-----------|--------|
| `data-translate` | `data-ru` / `data-en` → `textContent` |
| `data-translate-html` | `data-ru` / `data-en` → `innerHTML` (for `<br>`, `<span class="accent">`) |
| `data-translate-placeholder` | `data-placeholder-ru` / `data-placeholder-en` on inputs and textareas |

Language buttons: `.lang-btn` with `data-lang="ru|en"` and ids `lang-ru`, `lang-en`.

**Events:** `setCurrentLang()` dispatches `langchange` on `document` (used by speech recognition and canvas).

**Window:** `window.currentLang` is set for legacy-compatible canvas code.

**Note:** `Cases`, `Compare`, and `HowItWorks` body copy is Russian-only in markup. Only elements with `data-translate*` are switched to English.

### Contact modal — `modal.ts`

- **Open:** `openModal(optionalPrefill)` — adds `.open` on `#modal-overlay`, locks body scroll.
- **Close:** close button, overlay click outside `.modal`, Escape.
- **Submit:** prevents default; replaces `#modal-content` with a success message; auto-closes after 4s.
- **No network call** — form data is not sent to a backend. Integrating a real endpoint belongs in a separate API layer (not in this package).

Triggers: `data-open-modal` on buttons, or `openModal()` from hero/sphere logic.

### Hero input — `hero-input.ts`

- Elements: `#hero-input-field`, `#hero-send-btn`, `#hero-voice-btn`.
- **Send / Enter:** validates non-empty text → `openModal(text)` → clears field.
- **Focus/blur:** calls `window.setHeroState('INPUT_FOCUS' | 'AMBIENT')` when sphere script is active.
- **Voice:** Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`); language follows `getCurrentLang()`; on result, fills field and sends.
- **Toast:** creates `#app-toast` for errors/success (no dependency on legacy toast CSS from `v3/style.css` beyond `.toast` in `global.css`).

### Crystal sphere — `crystal-sphere.ts`

Ported from `v3/app.js` (IIFE around `#crystal-canvas`). Responsibilities:

- 2D canvas animation: glass sphere, AI robot (head/body/eyes), orbiting labels (Analytics, Accounting, Logistics, Content).
- Pointer tracking (mouse/touch), blink, scroll parallax (sphere moves/shrinks on scroll).
- Hero state machine on `window`: `AMBIENT`, `INPUT_FOCUS`, `PROCESSING`, `CINEMATIC`, `WORKSPACE`, `HIDDEN` (not all states used on this landing).
- `window.showRobotSpeech(type)` — updates `#bubble-text` / `#robot-bubble`.
- Click on floating labels triggers speech reactions.
- Includes `CanvasRenderingContext2D.roundRect` polyfill for older browsers.

**Important:** This file is large and tightly coupled to DOM ids (`crystal-canvas`, `sphere-trigger`, `robot-bubble`, `bubble-text`). Change ids in `Hero.astro` only together with script updates.

---

## Interactive user flows

### Lead capture (current behaviour)

```
User types in hero OR uses voice OR clicks Nav/CTA/sphere
        → openModal(optional task text)
        → user fills name, contact, description
        → submit → success UI (no server)
```

### Language switch

```
User clicks RU / EN
        → toggleLanguage(lang)
        → updates all [data-translate*] nodes
        → updates bubble default text
        → langchange event → speech recognition lang updated
```

---

## Build and development

```bash
cd astro
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # output: dist/
pnpm preview      # serve dist locally
```

**Node:** `>=22.12.0` (see `package.json` engines).

**Config:** `astro.config.mjs` uses default static output. To deploy with a canonical URL or sitemap later, add `site` in config:

```js
export default defineConfig({
  site: 'https://createmind.example',
});
```

### Astro CLI (background dev server)

```bash
astro dev --background
astro dev stop
astro dev status
astro dev logs
```

---

## Conventions for contributors and agents

1. **Frontend only** — Do not add API routes, server adapters, or secrets to this package unless explicitly requested.
2. **Match legacy class names** when touching styles — the CSS was migrated from inline HTML in `v3/index.html`.
3. **New translatable strings** — Add `data-ru` / `data-en` (or placeholder variants) on the element; do not hardcode only Russian without translation attributes if the string appears in Nav/Hero/CTA/Modal/Footer.
4. **Client logic** — Add modules under `src/scripts/` and import from `main.ts`. Avoid inline `<script>` in components unless trivial.
5. **Types** — Public script APIs use TypeScript; extend `Window` in `lib/lang.ts` if the canvas needs new globals.
6. **Components** — One section ≈ one `.astro` file in `components/`. Keep pages thin.
7. **Do not commit** `.env` files or Telegram tokens from `v3/`.
8. **Large edits to `crystal-sphere.ts`** — Test in browser: resize, scroll, RU/EN, mobile sphere size, pointer tracking.

---

## Relationship to `v3/` legacy

| Legacy | Astro equivalent |
|--------|------------------|
| `v3/index.html` (structure + inline CSS) | Components + `global.css` |
| `v3/index.html` (inline lang/modal JS) | `i18n.ts`, `modal.ts` |
| `v3/app.js` (crystal canvas block) | `crystal-sphere.ts` |
| `v3/app.js` (hero send → workspace) | `hero-input.ts` → modal (workspace UI removed) |
| `v3/server.js`, nginx, bot service | Out of scope |
| `v3/style.css` | Not used (Telegram mini-app theme) |

When fixing visual regressions, compare against `v3/index.html` in a browser side-by-side with `pnpm dev`.

---

## Possible future extensions (not implemented)

- Real lead API (Fastify/Node backend or form service)
- Astro i18n routes (`/en/`, `/ru/`) instead of client-side toggle
- Content collections for case studies
- `@astrojs/sitemap` once `site` URL is set
- Lazy-load `crystal-sphere.ts` (hero island) to reduce initial JS
- Port remaining `v3/app.js` features only if product scope expands (chat, discovery, workspace)

---

## External documentation

- [Astro docs](https://docs.astro.build)
- [Project structure](https://docs.astro.build/en/basics/project-structure/)
- [Styling](https://docs.astro.build/en/guides/styling/)
- [Scripts and event handling](https://docs.astro.build/en/guides/client-side-scripts/)
