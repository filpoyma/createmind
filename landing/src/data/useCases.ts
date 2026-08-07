import type { TLocale } from '../i18n/types';

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

const useCasesRu: IUseCase[] = [
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

const useCasesEn: IUseCase[] = [
	{
		id: 'answers',
		title: 'Customer replies',
		description:
			'Managers spend hours on the same questions in WhatsApp, Telegram, and Instagram. An AI assistant replies instantly, qualifies leads, and hands off only hot prospects.',
		badge: 'Save 4–6 manager hours per day',
		image: '/images/usecase-answers.jpg',
		imageAlt: 'AI automation for customer replies in messengers',
		imageWidth: 800,
		imageHeight: 1202,
	},
	{
		id: 'accounting',
		title: 'Accounting and spreadsheets',
		description:
			'If you track sales, payments, or inventory in spreadsheets — AI moves it into an automated system. Invoices, acts, and reports are generated without copying numbers.',
		badge: 'No manual entry — no errors',
		image: '/images/usecase-accounting.jpg',
		imageAlt: 'Accounting and spreadsheet automation',
		imageWidth: 800,
		imageHeight: 448,
	},
	{
		id: 'ecommerce',
		title: 'E-commerce and online retail',
		description:
			'Order processing, buyer notifications, stock and price updates — all run automatically. A manager steps in only when something is non-standard.',
		badge: 'Orders processed around the clock',
		image: '/images/usecase-ecommerce.jpg',
		imageAlt: 'AI automation for online store order processing',
		imageWidth: 800,
		imageHeight: 753,
	},
	{
		id: 'construction',
		title: 'Construction and service business',
		description:
			'Requests, cost estimates, proposal delivery, meeting reminders — AI handles this in seconds. Foremen and managers do the work, not calls and paperwork.',
		badge: 'Proposal sent within 2 minutes of inquiry',
		image: '/images/usecase-construction.jpg',
		imageAlt: 'Automation for requests and proposals in construction',
		imageWidth: 369,
		imageHeight: 247,
	},
	{
		id: 'clinics',
		title: 'Clinics, salons, and studios',
		description:
			'Booking via bot, day-before reminders, waitlists, review collection — without a receptionist on the phone. Clients pick a time and get confirmation themselves.',
		badge: '−30% missed appointments',
		image: '/images/usecase-clinics.jpg',
		imageAlt: 'AI bot for clinic, salon, and studio booking',
		imageWidth: 800,
		imageHeight: 1422,
	},
	{
		id: 'warehouse',
		title: 'Warehouse and logistics',
		description:
			'Inventory, shipment tracking, auto-reorder on low stock, invoices and documents — generated automatically without manual control of every line item.',
		badge: 'Stock mismatches cut by 80%',
		image: '/images/usecase-warehouse.jpg',
		imageAlt: 'Warehouse, inventory, and logistics automation',
		imageWidth: 800,
		imageHeight: 448,
	},
];

export const useCases: Record<TLocale, IUseCase[]> = {
	ru: useCasesRu,
	en: useCasesEn,
};
