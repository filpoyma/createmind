export interface IUseCase {
	id: string;
	title: string;
	description: string;
	badge: string;
	image: string;
	imageAlt: string;
	imageWidth: number;
	imageHeight: number;
}

export const useCases: IUseCase[] = [
	{
		id: 'answers',
		title: 'Ответы клиентам',
		description:
			'Менеджеры тратят часы на одинаковые вопросы в WhatsApp, Telegram и Instagram. AI-помощник отвечает мгновенно, квалифицирует клиента и передаёт менеджеру только горячих.',
		badge: 'Экономия 4–6 часов менеджера в день',
		image: '/images/usecase-answers.jpg',
		imageAlt: 'AI-автоматизация ответов клиентам в мессенджерах',
		imageWidth: 800,
		imageHeight: 1202,
	},
	{
		id: 'accounting',
		title: 'Бухгалтерия и учёт из Excel',
		description:
			'Если вы ведёте продажи, оплаты или склад в таблицах — AI переносит это в автоматическую систему. Счета, акты и отчёты формируются сами, без копирования цифр.',
		badge: 'Нет ручного ввода — нет ошибок',
		image: '/images/usecase-accounting.jpg',
		imageAlt: 'Автоматизация бухгалтерии и учёта в Excel',
		imageWidth: 800,
		imageHeight: 448,
	},
	{
		id: 'ecommerce',
		title: 'Магазин и интернет-торговля',
		description:
			'Обработка заказов, уведомления покупателям, обновление остатков и цен — всё это работает само. Менеджер подключается, только если что-то нестандартное.',
		badge: 'Заказы обрабатываются круглосуточно',
		image: '/images/usecase-ecommerce.jpg',
		imageAlt: 'AI-автоматизация интернет-магазина и обработки заказов',
		imageWidth: 800,
		imageHeight: 753,
	},
	{
		id: 'construction',
		title: 'Строительство и сервисный бизнес',
		description:
			'Заявки, расчёт стоимости, отправка КП, напоминания о встречах — AI делает это за секунды. Прораб или менеджер занимается работой, а не звонками и бумагами.',
		badge: 'КП отправляется за 2 минуты после заявки',
		image: '/images/usecase-construction.jpg',
		imageAlt: 'Автоматизация заявок и КП в строительстве и сервисе',
		imageWidth: 369,
		imageHeight: 247,
	},
	{
		id: 'clinics',
		title: 'Клиники, салоны и студии',
		description:
			'Запись через бота, напоминания за день до визита, лист ожидания, сбор отзывов — без администратора на телефоне. Клиент сам выбирает время и получает подтверждение.',
		badge: '−30% пропущенных записей',
		image: '/images/usecase-clinics.jpg',
		imageAlt: 'AI-бот для записи в клиники, салоны и студии',
		imageWidth: 800,
		imageHeight: 1422,
	},
	{
		id: 'warehouse',
		title: 'Склад и логистика',
		description:
			'Инвентаризация, отслеживание поставок, автозаказ при низком остатке, накладные и документы — формируются автоматически, без ручного контроля каждой позиции.',
		badge: 'Пересорт и нехватка сокращаются на 80%',
		image: '/images/usecase-warehouse.jpg',
		imageAlt: 'Автоматизация склада, инвентаризации и логистики',
		imageWidth: 800,
		imageHeight: 448,
	},
];
