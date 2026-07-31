import { initCrystalSphere } from './crystal-sphere';
import { initHeroInput } from './hero-input';
import { initI18n } from './i18n';
import { openModal, initModal } from './modal';

export function initApp(): void {
	initI18n();
	initModal();
	initHeroInput();
	initCrystalSphere();

	const sphereTrigger = document.getElementById('sphere-trigger');
	if (sphereTrigger) {
		sphereTrigger.addEventListener('click', () => openModal());
	}
}

if (typeof document !== 'undefined') {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initApp);
	} else {
		initApp();
	}
}
