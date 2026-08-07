import type { TLocale } from '../i18n/types';

export interface IProcessStep {
	number: string;
	title: string;
	description: string;
}

export const processSteps: Record<TLocale, IProcessStep[]> = {
	ru: [
		{
			number: '01',
			title: 'Разбираем процессы',
			description:
				'Погружаемся в ваш бизнес, находим, где теряются часы и деньги, и считаем потенциал автоматизации.',
		},
		{
			number: '02',
			title: 'Проектируем решение',
			description:
				'Собираем архитектуру под ваши задачи и согласовываем сценарии до старта разработки.',
		},
		{
			number: '03',
			title: 'Внедряем и обучаем',
			description:
				'Подключаем AI к вашим системам, запускаем на реальных данных и обучаем команду.',
		},
		{
			number: '04',
			title: 'Сопровождаем',
			description:
				'Следим за метриками, дорабатываем сценарии и масштабируем на новые отделы.',
		},
	],
	en: [
		{
			number: '01',
			title: 'Map your processes',
			description:
				'We dive into your business, find where hours and money are lost, and estimate automation potential.',
		},
		{
			number: '02',
			title: 'Design the solution',
			description:
				'We shape the architecture for your goals and align scenarios before development starts.',
		},
		{
			number: '03',
			title: 'Deploy and train',
			description:
				'We connect AI to your systems, launch on real data, and train your team.',
		},
		{
			number: '04',
			title: 'Support and scale',
			description:
				'We track metrics, refine scenarios, and scale to new departments.',
		},
	],
};
