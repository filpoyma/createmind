export interface IProcessStep {
	number: string;
	title: string;
	description: string;
}

export const processSteps: IProcessStep[] = [
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
];
