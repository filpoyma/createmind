import type { TLocale } from '../i18n/types';

export interface IManifestoPrinciple {
	number: string;
	title: string;
	description: string;
}

export interface IManifestoStat {
	value: string;
	label: string;
}

export const manifestoPrinciples: Record<TLocale, IManifestoPrinciple[]> = {
	ru: [
		{
			number: '01',
			title: 'Мы не продаём «нейросети»',
			description:
				'Мы убираем ручной труд. Клиенту всё равно, какая модель внутри — важно, что менеджер перестаёт копировать данные, а заявки перестают теряться. Мы говорим на языке результата, а не технологий.',
		},
		{
			number: '02',
			title: 'Встраиваемся в процессы, а не ломаем их',
			description:
				'Никакого «перепишем всё с нуля». Мы подключаем AI к тому, что у вас уже работает: CRM, таблицам, мессенджерам, сайту. Команда продолжает работать привычно — только быстрее и без рутины.',
		},
		{
			number: '03',
			title: 'Окупаемость, а не эксперименты',
			description:
				'Каждое внедрение считаем в деньгах и часах. Сначала — точка, где горит сильнее всего, потом расширение. Вы видите эффект уже в первый месяц, а не через год исследований.',
		},
	],
	en: [
		{
			number: '01',
			title: 'We do not sell "neural networks"',
			description:
				'We remove manual work. Clients do not care which model is inside — what matters is managers stop copying data and leads stop getting lost. We speak in outcomes, not technology.',
		},
		{
			number: '02',
			title: 'We fit your processes, not break them',
			description:
				'No "rewrite everything from scratch." We connect AI to what already works: CRM, spreadsheets, messengers, your site. Your team keeps working the same way — just faster and without routine.',
		},
		{
			number: '03',
			title: 'ROI, not experiments',
			description:
				'Every rollout is measured in money and hours. We start where it hurts most, then expand. You see impact in the first month, not after a year of research.',
		},
	],
};

export const manifestoStats: Record<TLocale, IManifestoStat[]> = {
	ru: [
		{ value: '40+', label: 'внедрений AI в бизнес' },
		{ value: '6 ч', label: 'рутины в день снимаем с сотрудника' },
		{ value: '3 нед', label: 'средний срок первого запуска' },
		{ value: '24/7', label: 'работа без выходных и обедов' },
	],
	en: [
		{ value: '40+', label: 'AI rollouts in business' },
		{ value: '6 h', label: 'of daily routine removed per employee' },
		{ value: '3 wk', label: 'average time to first launch' },
		{ value: '24/7', label: 'operation without weekends or breaks' },
	],
};
