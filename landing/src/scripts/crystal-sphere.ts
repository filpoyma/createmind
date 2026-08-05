import { getCurrentLang, type TLang } from '../lib/lang';

const ACCENT = '#10b981';
const ACCENT_RGB = '16, 185, 129';

type TPointer = {
	x: number | null;
	y: number | null;
};

function getCinematicStep(): number {
	return window.cinematicStep ?? 0;
}

// Polyfill for CanvasRenderingContext2D.roundRect
if (typeof CanvasRenderingContext2D.prototype.roundRect !== 'function') {
	CanvasRenderingContext2D.prototype.roundRect = function (
		x: number,
		y: number,
		w: number,
		h: number,
		radii?: number | number[],
	) {
		let rTopLeft = 0,
			rTopRight = 0,
			rBottomRight = 0,
			rBottomLeft = 0;
		if (radii === undefined || radii === null) radii = 0;
		if (Array.isArray(radii)) {
			if (radii.length === 1) {
				rTopLeft = rTopRight = rBottomRight = rBottomLeft = radii[0];
			} else if (radii.length === 2) {
				rTopLeft = rBottomRight = radii[0];
				rTopRight = rBottomLeft = radii[1];
			} else if (radii.length === 3) {
				rTopLeft = radii[0];
				rTopRight = rBottomLeft = radii[1];
				rBottomRight = radii[2];
			} else if (radii.length >= 4) {
				rTopLeft = radii[0];
				rTopRight = radii[1];
				rBottomRight = radii[2];
				rBottomLeft = radii[3];
			}
		} else {
			rTopLeft = rTopRight = rBottomRight = rBottomLeft = radii;
		}
		const maxRadius = Math.min(w / 2, h / 2);
		rTopLeft = Math.min(maxRadius, Math.max(0, rTopLeft));
		rTopRight = Math.min(maxRadius, Math.max(0, rTopRight));
		rBottomRight = Math.min(maxRadius, Math.max(0, rBottomRight));
		rBottomLeft = Math.min(maxRadius, Math.max(0, rBottomLeft));
		this.moveTo(x + rTopLeft, y);
		this.lineTo(x + w - rTopRight, y);
		this.quadraticCurveTo(x + w, y, x + w, y + rTopRight);
		this.lineTo(x + w, y + h - rBottomRight);
		this.quadraticCurveTo(x + w, y + h, x + w - rBottomRight, y + h);
		this.lineTo(x + rBottomLeft, y + h);
		this.quadraticCurveTo(x, y + h, x, y + h - rBottomLeft);
		this.lineTo(x, y + rTopLeft);
		this.quadraticCurveTo(x, y, x + rTopLeft, y);
		this.closePath();
		return this;
	};
}

export function initCrystalSphere(): void {
    const canvasEl = document.getElementById('crystal-canvas');
    if (!(canvasEl instanceof HTMLCanvasElement)) return;

    const canvas = canvasEl;
    const container = canvas.parentElement;
    if (!container) return;

    let drawCtx: CanvasRenderingContext2D;
    const maybeCtx = canvas.getContext('2d');
    if (!maybeCtx) return;
    drawCtx = maybeCtx;

    const sphereContainer = container;

    let width = canvas.width = sphereContainer.clientWidth;
    let height = canvas.height = sphereContainer.clientHeight;

    window.currentHeroState = 'AMBIENT'; // AMBIENT, CINEMATIC, INPUT_FOCUS, PROCESSING, WORKSPACE, HIDDEN

    window.setHeroState = function(state) {
        if (window.currentHeroState === state) return;
        const oldState = window.currentHeroState;
        window.currentHeroState = state;
        console.log(`[HeroState] Transition: ${oldState} -> ${state}`);

        // 1. Очистка предыдущего состояния
        if (oldState === 'CINEMATIC') {
            if (window.cinematicTimeouts) {
                window.cinematicTimeouts.forEach(clearTimeout);
                window.cinematicTimeouts = [];
            }
            const notif = document.getElementById('story-notification');
            if (notif) notif.className = 'story-notification';
        }

        if (state === 'WORKSPACE' || state === 'PROCESSING' || state === 'HIDDEN') {
            window.stopDecorativeTimers?.();
            window.stopCanvasLoop?.();
        }

        // 2. Инициализация нового состояния
        if (state === 'AMBIENT') {
            window.startCanvasLoop?.();
            window.startDecorativeTimers?.();
            window.ambientSpeedFactor = 1.0;
        } else if (state === 'CINEMATIC') {
            window.stopDecorativeTimers?.();
            window.startCanvasLoop?.();
            window.ambientSpeedFactor = 0.05;
        } else if (state === 'INPUT_FOCUS') {
            window.stopDecorativeTimers?.();
            window.startCanvasLoop?.();
            window.ambientSpeedFactor = 0.15; // Замедляем орбиты
        } else if (state === 'PROCESSING') {
            const ticker = document.getElementById('live-event-ticker');
            const tickerVal = document.getElementById('ticker-text-val');
            if (ticker && tickerVal) {
                tickerVal.textContent = (getCurrentLang() === 'en') ? 'Processing request...' : 'Обрабатываю запрос...';
                ticker.className = 'live-event-ticker visible';
            }
        } else if (state === 'WORKSPACE') {
            // В воркспейсе все остановлено
        }
    };

    // Поддержка высокой плотности пикселей (High DPI Retina)
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        // Используем offsetWidth как fallback на случай если контейнер ещё не отрендерен
        width = sphereContainer.clientWidth || sphereContainer.offsetWidth || canvas.offsetWidth || 380;
        height = sphereContainer.clientHeight || sphereContainer.offsetHeight || canvas.offsetHeight || 380;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        drawCtx.scale(dpr, dpr);
    }
    
    resize();
    // Повторная инициализация после полной загрузки DOM на случай delayed render
    if (document.readyState !== 'complete') {
        window.addEventListener('load', resize);
    } else {
        setTimeout(resize, 50);
    }
    window.addEventListener('resize', resize);

    // Переменные состояния анимации
    let lastBlinkTime = 0;
    const blinkDuration = 180; // мс
    let lastBlinkTrigger = 0;

    // Глобальные флаги сюжетного сценария первого визита (Cinematic Experience)
    window.cinematicStep = 0;
    window.ambientSpeedFactor = 0.05; // В начале почти стоим на месте (полный покой)

    // Переменные системы Motion System: скролл и фокус внимания (Attention Breathing)
    let scrollRatio = 0;
    let attentionTarget = 'sphere'; // 'sphere', 'card', 'cta'

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const maxScroll = window.innerHeight || 800;
        scrollRatio = Math.max(0, Math.min(scrolled / maxScroll, 1.0));
    }, { passive: true });

    // Отслеживание курсора/тача для слежения глаз
    const pointer: TPointer = { x: null, y: null };

    window.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        // Координаты относительно центра канваса
        pointer.x = e.clientX - (rect.left + rect.width / 2);
        pointer.y = e.clientY - (rect.top + rect.height / 2);
    });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            pointer.x = e.touches[0].clientX - (rect.left + rect.width / 2);
            pointer.y = e.touches[0].clientY - (rect.top + rect.height / 2);
        }
    }, { passive: true });

    window.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            pointer.x = e.touches[0].clientX - (rect.left + rect.width / 2);
            pointer.y = e.touches[0].clientY - (rect.top + rect.height / 2);
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        pointer.x = null;
        pointer.y = null;
    });

    window.addEventListener('mouseleave', () => {
        pointer.x = null;
        pointer.y = null;
    });

    // Каустика света (Light Caustics) при обработке задач
    let causticAlpha = 0;

    // Сглаживание взгляда во время Cinematic Sequence
    let cinematicLookX = 0;
    let cinematicLookY = 0;
    let cinematicRot = 0;

    // Переменные для голографического 3D глобуса (Business Map)
    let globeActive = false;
    let globeStartTime = 0;
    const globeDuration = 5000; // 5 секунд
    let globeLocation = '';
    let lastGlobeTrigger = Date.now();
    const globeLocations = ["Singapore", "Dubai", "London", "Berlin", "Bali"];

    function triggerGlobe() {
        globeActive = true;
        globeStartTime = Date.now();
        globeLocation = globeLocations[Math.floor(Math.random() * globeLocations.length)];
    }

    // Переменные для пульсации Business Pulse
    let pulseRadius = -1;
    let pulseOpacity = 0;

    window.triggerBusinessPulse = function() {
        pulseRadius = 0; // Стартует из центра сферы
        pulseOpacity = 0.55;
    };

    const defaultSpeech: Record<TLang, string> = {
        ru: 'Какая у вас задача для меня?',
        en: 'What is your task for me?',
    };

    let speechBubbleTimer: ReturnType<typeof setTimeout> | null = null;

    window.showRobotSpeech = function () {
        const bubble = document.getElementById('robot-bubble');
        const bubbleText = document.getElementById('bubble-text');
        if (!bubble || !bubbleText) return;

        const lang = getCurrentLang();

        bubbleText.textContent = defaultSpeech[lang];
        bubble.classList.add('force-show');

        window.setHeroState?.('PROCESSING');
        setTimeout(() => {
            window.setHeroState?.('AMBIENT');
        }, 1200);

        if (speechBubbleTimer) clearTimeout(speechBubbleTimer);
        speechBubbleTimer = setTimeout(() => {
            bubble.classList.remove('force-show');
            bubbleText.textContent = defaultSpeech[lang];
        }, 5000);
    };

    function drawSphere(time: number) {
        drawCtx.clearRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const baseRadius = Math.min(width, height) * 0.40;

        // Обновляем уровень каустики (Light Caustics) в зависимости от работы ИИ
        const isProcessing = getCinematicStep() >= 1 && getCinematicStep() <= 6;
        
        if (isProcessing) {
            if (causticAlpha < 0.70) causticAlpha += 0.03;
        } else {
            if (causticAlpha > 0) causticAlpha -= 0.02;
        }
        
        // Медленное парение сферы с учетом скролла (уезжает вверх и сжимается)
        const floatY = Math.sin(time * 1.5) * 5;
        const floatX = Math.cos(time * 0.9) * 3;
        const scx = cx + floatX;
        
        // Смещение сферы вверх и сжатие при скролле (Scroll Transition)
        const finalScy = cy + floatY - scrollRatio * 155;
        const finalBaseRadius = baseRadius * (1.0 - scrollRatio * 0.32);

        // Матовый стеклянный фон внутри сферы
        const frostBg = drawCtx.createRadialGradient(
            scx,
            finalScy,
            finalBaseRadius * 0.1,
            scx,
            finalScy,
            finalBaseRadius * 1.05,
        );
        frostBg.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
        frostBg.addColorStop(0.55, 'rgba(255, 255, 255, 0.1)');
        frostBg.addColorStop(0.85, `rgba(${ACCENT_RGB}, 0.07)`);
        frostBg.addColorStop(1, `rgba(${ACCENT_RGB}, 0.03)`);
        drawCtx.fillStyle = frostBg;
        drawCtx.beginPath();
        drawCtx.arc(scx, finalScy, finalBaseRadius * 1.05, 0, Math.PI * 2);
        drawCtx.fill();

        // Внутреннее свечение сферы (ИИ)
        const innerGlow = drawCtx.createRadialGradient(scx, finalScy, 0, scx, finalScy, finalBaseRadius);
        const glowColor = `rgba(${ACCENT_RGB}, 0.1)`;
        const glowColorCenter = `rgba(${ACCENT_RGB}, 0.2)`;

        innerGlow.addColorStop(0, glowColorCenter);
        innerGlow.addColorStop(0.6, glowColor);
        innerGlow.addColorStop(1, 'transparent');
        drawCtx.fillStyle = innerGlow;
        drawCtx.beginPath();
        drawCtx.arc(scx, finalScy, finalBaseRadius * 1.2, 0, Math.PI * 2);
        drawCtx.fill();

        // --- ОПТИЧЕСКАЯ КАУСТИКА СВЕТА ВНУТРИ КРИСТАЛЛА (Light Caustics) ---
        if (causticAlpha > 0.01) {
            drawCtx.save();
            // Маскируем каустику строго по внутреннему диаметру сферы
            drawCtx.beginPath();
            drawCtx.arc(scx, finalScy, finalBaseRadius * 0.94, 0, Math.PI * 2);
            drawCtx.clip();

            drawCtx.strokeStyle = `rgba(${ACCENT_RGB}, ${causticAlpha * 0.16})`;
            drawCtx.lineWidth = 1.6;
            drawCtx.shadowBlur = 6;
            drawCtx.shadowColor = ACCENT;

            // Рисуем 3 переливающиеся волны света Безье
            for (let j = 0; j < 3; j++) {
                drawCtx.beginPath();
                const offset = j * Math.PI / 3;
                const waveTime = time * 0.75 + offset;
                
                const yOffset1 = Math.sin(waveTime) * (finalBaseRadius * 0.25);
                const yOffset2 = Math.cos(waveTime * 1.2) * (finalBaseRadius * 0.20);
                
                drawCtx.moveTo(scx - finalBaseRadius * 0.9, finalScy + yOffset1);
                drawCtx.bezierCurveTo(
                    scx - finalBaseRadius * 0.3, finalScy - finalBaseRadius * 0.5 * Math.sin(waveTime),
                    scx + finalBaseRadius * 0.3, finalScy + finalBaseRadius * 0.5 * Math.cos(waveTime * 0.8),
                    scx + finalBaseRadius * 0.9, finalScy + yOffset2
                );
                drawCtx.stroke();
            }
            drawCtx.restore();
        }

        // --- ГОЛОГРАФИЧЕСКИЙ 3D-ГЛОБУС (BUSINESS MAP) ---
        if (false && window.currentHeroState === 'AMBIENT' && Date.now() - lastGlobeTrigger > 22000) {
            triggerGlobe();
            lastGlobeTrigger = Date.now();
        }

        if (false && globeActive) {
            const elapsedGlobe = Date.now() - globeStartTime;
            if (elapsedGlobe < globeDuration) {
                let globeAlpha = 0.22;
                if (elapsedGlobe < 700) globeAlpha *= (elapsedGlobe / 700);
                else if (elapsedGlobe > globeDuration - 700) globeAlpha *= ((globeDuration - elapsedGlobe) / 700);

                drawCtx.save();
                drawCtx.translate(scx, finalScy);
                const rotSpeed = time * 0.35;
                drawCtx.strokeStyle = `rgba(${ACCENT_RGB}, ${globeAlpha})`;
                drawCtx.lineWidth = 0.65;
                drawCtx.shadowBlur = 0;

                const globeR = baseRadius * 0.85;

                // Меридианы
                for (let i = 0; i < 6; i++) {
                    const angle = rotSpeed + (i * Math.PI / 6);
                    const w = globeR * Math.cos(angle);
                    drawCtx.beginPath();
                    drawCtx.ellipse(0, 0, Math.abs(w), globeR, 0, 0, Math.PI * 2);
                    drawCtx.stroke();
                }

                // Параллели
                for (let i = 1; i < 5; i++) {
                    const y = globeR * Math.cos(i * Math.PI / 5);
                    const w = globeR * Math.sin(i * Math.PI / 5);
                    drawCtx.beginPath();
                    drawCtx.ellipse(0, y, w, w * 0.20, 0, 0, Math.PI * 2);
                    drawCtx.stroke();
                }

                // Активная ИИ-Нода (Город)
                const locY = globeR * 0.15;
                const locW = globeR * 0.72;
                const locX = locW * Math.sin(time * 0.7);
                const locZ = Math.cos(time * 0.7);

                if (locZ > 0) {
                    drawCtx.fillStyle = '#ffffff';
                    drawCtx.shadowColor = ACCENT;
                    drawCtx.shadowBlur = 10;
                    drawCtx.beginPath();
                    drawCtx.arc(locX, locY, 3.5, 0, Math.PI * 2);
                    drawCtx.fill();

                    drawCtx.fillStyle = 'rgba(255, 255, 255, ' + (globeAlpha * 3.5) + ')';
                    drawCtx.font = '800 6.5px monospace';
                    drawCtx.textAlign = 'center';
                    drawCtx.fillText(`● AI NODE: ${globeLocation.toUpperCase()}`, locX, locY - 7);
                }
                drawCtx.restore();
            } else {
                globeActive = false;
            }
        }

        // ------------------ ОТРЕСОВКА РОБОТА (AI EMPLOYEE) ------------------
        // Attention Breathing: ИИ дышит медленнее, когда фокус на других элементах
        const breathAmp = (attentionTarget === 'sphere') ? 0.024 : 0.005;
        const breath = Math.sin(time * 2.0) * breathAmp;
        const scrollScale = finalBaseRadius / baseRadius; // Коэффициент сжатия при скролле
        const robotScale = (1.0 + breath) * scrollScale;
        
        const headW = 74 * robotScale;
        const headH = 74 * robotScale;
        const headY = finalScy - 22 * scrollScale;

        let lookOffsetX = 0;
        let lookOffsetY = 0;
        let rotateAngle = 0;

        if (window.currentHeroState === 'CINEMATIC') {
            // Сюжетный режим первого визита
            let targetLookX = 0;
            let targetLookY = 0;
            let targetRot = 0;

            const cinematicStep = getCinematicStep();

            if (cinematicStep === 0 || cinematicStep === 1) {
                // Полный покой, легкое блуждание
                targetLookX = Math.sin(time * 0.4) * 0.8;
                targetLookY = Math.cos(time * 0.6) * 0.5;
                targetRot = Math.sin(time * 0.3) * 0.01;
            } else if (cinematicStep === 2 || cinematicStep === 3 || cinematicStep === 4) {
                // Поворот головы влево-вверх к первому уведомлению
                targetLookX = -3.2 * robotScale;
                targetLookY = -1.2 * robotScale;
                targetRot = -0.05;
            } else if (cinematicStep === 7) {
                // Поворот вправо-вверх ко второму уведомлению
                targetLookX = 2.8 * robotScale;
                targetLookY = -1.0 * robotScale;
                targetRot = 0.04;
            } else {
                // Плавное центрирование
                targetLookX = 0;
                targetLookY = 0;
                targetRot = 0;
            }

            // Плавное сглаживание переходов
            cinematicLookX += (targetLookX - cinematicLookX) * 0.06;
            cinematicLookY += (targetLookY - cinematicLookY) * 0.06;
            cinematicRot += (targetRot - cinematicRot) * 0.06;

            lookOffsetX = cinematicLookX;
            lookOffsetY = cinematicLookY;
            rotateAngle = cinematicRot;
        } else if (window.currentHeroState === 'INPUT_FOCUS') {
            // Фиксация взгляда на инпуте слева-внизу
            const targetLookX = -3.5 * robotScale;
            const targetLookY = 1.0 * robotScale;
            const targetRot = -0.06;

            cinematicLookX += (targetLookX - cinematicLookX) * 0.08;
            cinematicLookY += (targetLookY - cinematicLookY) * 0.08;
            cinematicRot += (targetRot - cinematicRot) * 0.08;

            lookOffsetX = cinematicLookX;
            lookOffsetY = cinematicLookY;
            rotateAngle = cinematicRot;
        } else if (window.currentHeroState === 'PROCESSING') {
            // При процессинге робот плавно блуждает глазами в концентрации (быстрые вычисления)
            const targetLookX = Math.sin(time * 1.8) * 0.5;
            const targetLookY = Math.cos(time * 2.2) * 0.3;
            const targetRot = Math.sin(time * 1.5) * 0.005;

            cinematicLookX += (targetLookX - cinematicLookX) * 0.08;
            cinematicLookY += (targetLookY - cinematicLookY) * 0.08;
            cinematicRot += (targetRot - cinematicRot) * 0.08;

            lookOffsetX = cinematicLookX;
            lookOffsetY = cinematicLookY;
            rotateAngle = cinematicRot;
        } else {
            // Обычный интерактивный режим AMBIENT (или по умолчанию)
            // Слежение за курсором работает по всему экрану
            const distance = (pointer.x !== null && pointer.y !== null) 
                ? Math.sqrt(pointer.x * pointer.x + pointer.y * pointer.y) 
                : 999;
                
            let targetLookX = 0;
            let targetLookY = 0;
            let targetRot = 0;

            if (pointer.x !== null && pointer.y !== null) {
                const angle = Math.atan2(pointer.y, pointer.x);
                const maxLook = 4.8 * robotScale;
                const strength = Math.min(distance / 200, 1.0);
                targetLookX = Math.cos(angle) * maxLook * strength;
                targetLookY = Math.sin(angle) * maxLook * strength;
                // Более заметный поворот головы (до ~14 градусов наклон)
                targetRot = Math.max(-0.24, Math.min(0.24, (pointer.x / 320)));
            } else {
                targetLookX = Math.sin(time * 0.6) * 1.4;
                targetLookY = Math.cos(time * 0.9) * 0.9;
                targetRot = Math.sin(time * 0.4) * 0.015;
            }

            cinematicLookX += (targetLookX - cinematicLookX) * 0.05;
            cinematicLookY += (targetLookY - cinematicLookY) * 0.05;
            cinematicRot += (targetRot - cinematicRot) * 0.05;

            lookOffsetX = cinematicLookX;
            lookOffsetY = cinematicLookY;
            rotateAngle = cinematicRot;
        }

        const eyeColor = ACCENT;

        // ------------------ ОТРЕСОВКА ТЕЛА РОБОТА (AI BODY) ------------------
        drawCtx.save();
        drawCtx.translate(scx, headY);
        // Тело слегка покачивается вслед за головой
        drawCtx.rotate(rotateAngle * 0.2);

        // Шея
        drawCtx.fillStyle = '#d4d4d8';
        drawCtx.beginPath();
        drawCtx.roundRect(-6 * robotScale, 15 * robotScale, 12 * robotScale, 18 * robotScale, 3 * robotScale);
        drawCtx.fill();

        // Индикатор на шее
        drawCtx.fillStyle = ACCENT;
        drawCtx.shadowColor = ACCENT;
        drawCtx.shadowBlur = 8;
        drawCtx.beginPath();
        drawCtx.arc(0, 24 * robotScale, 2.8 * robotScale, 0, Math.PI * 2);
        drawCtx.fill();
        drawCtx.shadowBlur = 0;

        // Маленькое туловище
        const bodyW = 54 * robotScale;
        const bodyH = 38 * robotScale;
        const bodyGradient = drawCtx.createLinearGradient(-bodyW/2, 24 * robotScale, bodyW/2, (24 + bodyH) * robotScale);
        bodyGradient.addColorStop(0, '#ffffff');
        bodyGradient.addColorStop(0.5, '#e4e4e7');
        bodyGradient.addColorStop(1, '#a1a1aa');
        drawCtx.fillStyle = bodyGradient;
        
        drawCtx.beginPath();
        drawCtx.roundRect(-bodyW/2, 24 * robotScale, bodyW, bodyH, [16 * robotScale, 16 * robotScale, 6 * robotScale, 6 * robotScale]);
        drawCtx.fill();

        // Светящееся ядро на груди
        drawCtx.fillStyle = eyeColor;
        drawCtx.shadowColor = eyeColor;
        drawCtx.shadowBlur = 10;
        drawCtx.beginPath();
        drawCtx.arc(0, 42 * robotScale, 5 * robotScale, 0, Math.PI * 2);
        drawCtx.fill();
        drawCtx.shadowBlur = 0; // сбрасываем

        drawCtx.restore();

        drawCtx.save();
        drawCtx.translate(scx, headY);
        drawCtx.rotate(rotateAngle);

        drawCtx.shadowColor = `rgba(${ACCENT_RGB}, 0.15)`;
        drawCtx.shadowBlur = 20;

        const шлемGradient = drawCtx.createLinearGradient(-headW/2, -headH/2, headW/2, headH/2);
        шлемGradient.addColorStop(0, '#ffffff');
        шлемGradient.addColorStop(0.5, '#e4e4e7');
        шлемGradient.addColorStop(1, '#a1a1aa');
        
        drawCtx.fillStyle = шлемGradient;
        drawCtx.beginPath();
        drawCtx.arc(0, 0, headW/2, 0, Math.PI * 2);
        drawCtx.fill();

        const maskW = 56 * robotScale;
        const maskH = 46 * robotScale;
        const maskOffsetX = lookOffsetX * 0.45;
        const maskOffsetY = lookOffsetY * 0.35;

        drawCtx.fillStyle = '#09090b';
        drawCtx.beginPath();
        drawCtx.ellipse(maskOffsetX, 2 + maskOffsetY, maskW/2, maskH/2, 0, 0, Math.PI * 2);
        drawCtx.fill();

        const maskHighlight = drawCtx.createLinearGradient(-maskW/2 + maskOffsetX, -maskH/2 + 2 + maskOffsetY, maskOffsetX, 2 + maskOffsetY);
        maskHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
        maskHighlight.addColorStop(1, 'transparent');
        drawCtx.fillStyle = maskHighlight;
        drawCtx.beginPath();
        drawCtx.ellipse(maskOffsetX, 2 + maskOffsetY, maskW/2, maskH/2, 0, 0, Math.PI * 2);
        drawCtx.fill();

        const eyeSpacing = 14 * robotScale;
        const eyeW = 8 * robotScale;
        const eyeH = 8 * robotScale;

        let isBlinking = false;
        const now = Date.now();
        if (now - lastBlinkTime < blinkDuration) {
            isBlinking = true;
        } else if (now - lastBlinkTrigger > 4000 + Math.random() * 3000) {
            lastBlinkTime = now;
            lastBlinkTrigger = now;
            isBlinking = true;
        }

        drawCtx.fillStyle = eyeColor;
        drawCtx.shadowColor = eyeColor;
        drawCtx.shadowBlur = 12;

        const finalEyeY = 1 + lookOffsetY;

        if (isBlinking) {
            drawCtx.fillRect(-eyeSpacing + lookOffsetX - eyeW/2, finalEyeY + eyeH/2 - 1, eyeW, 2);
            drawCtx.fillRect(eyeSpacing + lookOffsetX - eyeW/2, finalEyeY + eyeH/2 - 1, eyeW, 2);
        } else {
            drawCtx.beginPath();
            drawCtx.arc(-eyeSpacing + lookOffsetX, finalEyeY, eyeW/2, 0, Math.PI * 2);
            drawCtx.arc(eyeSpacing + lookOffsetX, finalEyeY, eyeW/2, 0, Math.PI * 2);
            drawCtx.fill();
        }

        drawCtx.restore();

        // ------------------ СТЕКЛЯННАЯ СФЕРА (GLASS EFFECTS) ------------------
        drawCtx.save();
        
        // Внешний контур стекла (физический край)
        drawCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        drawCtx.lineWidth = 1.0;
        drawCtx.beginPath();
        drawCtx.arc(scx, finalScy, finalBaseRadius, 0, Math.PI * 2);
        drawCtx.stroke();

        // Внутренний контур (толщина линзы кристалла)
        drawCtx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        drawCtx.lineWidth = 0.8;
        drawCtx.beginPath();
        drawCtx.arc(scx, finalScy, finalBaseRadius - 3.5, 0, Math.PI * 2);
        drawCtx.stroke();

        // Блик каустики/преломления на краю
        drawCtx.strokeStyle = `rgba(${ACCENT_RGB}, 0.08)`;
        drawCtx.lineWidth = 2.0;
        drawCtx.beginPath();
        drawCtx.arc(scx, finalScy, finalBaseRadius - 1.5, Math.PI * 0.75, Math.PI * 1.25);
        drawCtx.stroke();

        const topGlow = drawCtx.createRadialGradient(scx, finalScy - finalBaseRadius * 0.5, 0, scx, finalScy - finalBaseRadius * 0.5, finalBaseRadius * 0.9);
        topGlow.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
        topGlow.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
        topGlow.addColorStop(1, 'transparent');
        drawCtx.fillStyle = topGlow;
        drawCtx.beginPath();
        drawCtx.arc(scx, finalScy, finalBaseRadius, 0, Math.PI * 2);
        drawCtx.fill();

        drawCtx.beginPath();
        drawCtx.arc(scx + finalBaseRadius * 0.1, finalScy - finalBaseRadius * 0.1, finalBaseRadius * 0.9, 0, Math.PI * 2);
        const glassSpecular = drawCtx.createLinearGradient(scx, finalScy - finalBaseRadius, scx, finalScy);
        glassSpecular.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        glassSpecular.addColorStop(0.4, 'rgba(255, 255, 255, 0.02)');
        glassSpecular.addColorStop(1, 'transparent');
        drawCtx.fillStyle = glassSpecular;
        drawCtx.fill();

        const bottomGlow = drawCtx.createRadialGradient(scx, finalScy + finalBaseRadius * 0.7, 0, scx, finalScy + finalBaseRadius * 0.7, finalBaseRadius * 0.6);
        bottomGlow.addColorStop(0, `rgba(${ACCENT_RGB}, 0.14)`);
        bottomGlow.addColorStop(1, 'transparent');
        drawCtx.fillStyle = bottomGlow;
        drawCtx.beginPath();
        drawCtx.arc(scx, finalScy, finalBaseRadius, 0, Math.PI * 2);
        drawCtx.fill();

        drawCtx.restore();

        // Отрисовка Business Pulse (круговая неоновая волна)
        if (pulseRadius >= 0) {
            pulseRadius += 2.4;
            pulseOpacity = 0.55 * (1.0 - (pulseRadius / baseRadius));
            
            if (pulseRadius >= baseRadius) {
                pulseRadius = -1;
            } else {
                drawCtx.save();
                drawCtx.strokeStyle = `rgba(${ACCENT_RGB}, ${pulseOpacity})`;
                drawCtx.lineWidth = 1.6;
                drawCtx.shadowColor = ACCENT;
                drawCtx.shadowBlur = 8;
                drawCtx.arc(scx, finalScy, pulseRadius, 0, Math.PI * 2);
                drawCtx.stroke();
                drawCtx.restore();
            }
        }

        canvas.style.cursor = 'pointer';
    }

    window.isCanvasRunning = true;
    window.startCanvasLoop = function() {
        if (!window.isCanvasRunning) {
            window.isCanvasRunning = true;
            animateLoop();
        }
    };
    window.stopCanvasLoop = function() {
        window.isCanvasRunning = false;
    };

    function animateLoop() {
        if (!window.isCanvasRunning) return;
        const time = Date.now() * 0.001;
        drawSphere(time);
        requestAnimationFrame(animateLoop);
    }

    animateLoop();
}
