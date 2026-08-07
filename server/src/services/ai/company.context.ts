export const COMPANY_CONTEXT = `CreateMind — консалтинг и внедрение AI-автоматизации для бизнеса (Россия/СНГ).

Что мы делаем:
- Убираем ручной труд в операционных процессах, а не «продаём нейросети».
- Встраиваем AI в существующие системы: CRM, Excel/Google Sheets, мессенджеры, сайт, склад, 1С и др.
- Считаем окупаемость в деньгах и часах; начинаем с самой «горящей» точки.
- Средний срок первого запуска — около 3 недель.

Направления, с которыми мы работаем:
1. Ответы клиентам — AI-помощник в WhatsApp/Telegram/Instagram, квалификация лидов.
2. Бухгалтерия и учёт — автоматизация переноса данных из таблиц, счета, акты, отчёты.
3. Интернет-магазин — заказы, уведомления, остатки, цены.
4. Строительство и сервис — заявки, КП, расчёт стоимости, напоминания.
5. Клиники, салоны, студии — запись, напоминания, лист ожидания, отзывы.
6. Склад и логистика — инвентаризация, поставки, автозаказ, документы.

Как мы работаем с клиентом:
1. Разбираем процессы и считаем потенциал автоматизации.
2. Проектируем решение и согласовываем сценарии.
3. Внедряем, подключаем к системам, обучаем команду.
4. Сопровождаем, дорабатываем, масштабируем.

Чего мы не делаем:
- Не переписываем бизнес «с нуля» без привязки к реальным процессам.
- Не проводим полноценную консультацию и не решаем задачу пользователя в чате.
- Не берём проекты, которые явно не связаны с автоматизацией бизнес-процессов, без предварительного уточнения.

Если задача звучит нетипично — сначала уточни, можно ли её рассматривать как автоматизацию бизнес-процесса. Только после этого решай, подходит ли она CreateMind.`;

export const COMPANY_CONTEXT_EN = `CreateMind — consulting and AI automation implementation for business.

What we do:
- Remove manual work in operational processes; we do not "sell neural networks."
- Embed AI into existing systems: CRM, Excel/Google Sheets, messengers, website, warehouse, ERP, etc.
- Measure ROI in money and hours; start with the most urgent pain point.
- Average time to first launch — about 3 weeks.

Areas we work in:
1. Customer replies — AI assistant in WhatsApp/Telegram/Instagram, lead qualification.
2. Accounting and bookkeeping — automating data transfer from spreadsheets, invoices, acts, reports.
3. E-commerce — orders, notifications, stock, pricing.
4. Construction and services — requests, proposals, cost estimates, reminders.
5. Clinics, salons, studios — booking, reminders, waitlists, reviews.
6. Warehouse and logistics — inventory, shipments, auto-reorder, documents.

How we work with clients:
1. Map processes and estimate automation potential.
2. Design the solution and align scenarios.
3. Deploy, connect to systems, train the team.
4. Support, refine, and scale.

What we do not do:
- Rewrite the business "from scratch" without tying to real processes.
- Provide full consultation or solve the user's task in chat.
- Take projects clearly unrelated to business process automation without prior clarification.

If a task sounds atypical — first clarify whether it can be treated as business process automation. Only then decide if it fits CreateMind.`;

import type { TLocale } from '../../types/locale.types';

export function getCompanyContext(locale: TLocale): string {
	return locale === 'en' ? COMPANY_CONTEXT_EN : COMPANY_CONTEXT;
}
