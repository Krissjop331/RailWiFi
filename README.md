# RailWiFi — платёжный captive‑портал

**RailWiFi** — это демонстрационный Wi‑Fi captive‑портал для поездов/кафе/офисов с оплатой доступа по тарифам и простой админкой. 
Пользователь вводит MAC‑адрес устройства, выбирает тариф и оплачивает (в проекте — через STUB‑интеграцию Kaspi/QR). 
После подтверждения оплаты устройство получает доступ с ограничением по времени. Администратор может просматривать активные сессии и управлять тарифами.


## ✨ Возможности

- Выбор тарифа и оформление оплаты (Stub интеграция Kaspi/QR).
- Авторизация устройства по MAC, выдача временного доступа.
- Страница оплаты с автоматическим опросом статуса платежа.
- Страница успеха с отображением времени окончания доступа в часовом поясе Казахстана.
- Админка: вход по логину/паролю, просмотр активных сессий, продление/сокращение, CRUD тарифов.
- REST API с Swagger (NestJS), Prisma/PostgreSQL.

## 🧱 Стек

- **Frontend:** Next.js 15 (React 19), TypeScript, TailwindCSS 4.
- **Backend:** NestJS 11, Prisma ORM, PostgreSQL.
- **Время/форматирование:** date‑fns, date‑fns‑tz.
- **Аутентификация админки:** JWT + HTTP‑only cookie.
- **Интеграции:** заглушки Kaspi (оплата) и Omada (авторизация по MAC).

## 📁 Структура репозитория

```
/api   — NestJS + Prisma (REST API)
/web   — Next.js приложение (портал + админка)
```

Ключевые директории бэкенда:
```
api/src/
  admin/            — эндпоинты админки (логин, тарифы, сессии)
  payments/         — создание платежа, статус, mock‑подтверждение
    adapters/       — заглушки Kaspi и Omada
  portal/           — авторизация устройства по MAC (проверка доступа)
  tariffs/          — сервис тарифов
  common/time       — сервис времени/таймзоны (Asia/Almaty)
  prisma/           — модуль Prisma (подключение к БД)
prisma/schema.prisma — модели: Tariff, Device, Payment, AccessTicket, Session
```

Ключевые страницы фронтенда:
```
/        — ввод MAC, выбор тарифа, кнопка «Оплатить»
/pay/[id]?mac=...  — страница оплаты, опрос статуса, кнопка «Подтвердить оплату (STUB)»
/success?mac=...   — успешная авторизация и время окончания доступа
/admin/login       — вход в админку
/admin             — дашборд: сессии + тарифы
```

## ⚙️ Подготовка окружения

### 1) PostgreSQL

Используйте локальный сервер или Docker:

```bash
docker run -d --name wifi-postgres \
  -e POSTGRES_USER=wifi_user -e POSTGRES_PASSWORD=StrongPass_123 \
  -e POSTGRES_DB=wifi_train -p 5432:5432 postgres:16
```

### 2) Конфиг переменных окружения

Создайте `api/.env` на основе примера:

```ini
DATABASE_URL="postgresql://wifi_user:StrongPass_123@localhost:5432/wifi_train?schema=public"
PORT=5001
TIMEZONE=Asia/Almaty
CORS_ORIGINS=http://localhost:3000

ADMIN_USER=admin
ADMIN_PASS=admin123
ADMIN_JWT_SECRET=supersecret_change_me
ADMIN_COOKIE_NAME=admin_token
```

Создайте `web/.env.local`:

```ini
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001/api
```

## ▶️ Локальный запуск

### Backend (API)
```bash
cd api
npm i
npx prisma migrate dev   # применить миграции
npm run db:seed          # засеять базовые тарифы
npm run start:dev        # http://localhost:5001
```

### Frontend (Web)
```bash
cd web
npm i
npm run dev              # http://localhost:3000
```

> **CORS:** убедитесь, что `CORS_ORIGINS` в `api/.env` содержит адрес фронтенда.

## 🧪 Как протестировать оплату (STUB)

1. На главной странице введите MAC (например, `AA-BB-CC-11-22-33`), выберите тариф — нажмите **Оплатить**.
2. Вы попадёте на `/pay/[id]`. Здесь идёт авто‑опрос статуса каждые 2 сек.
3. Нажмите кнопку **«Подтвердить оплату (STUB)»** — статус сменится на *paid*.
4. Вас перенаправит на `/success?mac=...`, где видно локальное время окончания доступа.

## 🔐 Админка

- Вход: `http://localhost:3000/admin/login`
- Логин/пароль — из переменных `ADMIN_USER` / `ADMIN_PASS`.
- Возможности:
  - Сессии: список, поиск по MAC, продление (+мин) / сокращение (−мин).
  - Тарифы: список всех, включение/выключение, создание/редактирование/удаление.

## 🗄️ Схема БД (Prisma)

Модели:
- **Tariff** — тарифы (название, длительность в минутах, цена KZT, `active`).
- **Device** — устройства (MAC).
- **Payment** — платежи (сумма, статус: `created|pending|paid|failed|expired|refunded`, провайдер и id заказа).
- **AccessTicket** — билет доступа для устройства (временные рамки).
- **Session** — сессии (учёт трафика; для MVP — базовые поля).

> Для MVP интеграции `Kaspi` и `Omada` реализованы как заглушки в `api/src/payments/adapters/`. В реальном проекте сюда подключаются SDK/HTTP‑клиенты провайдеров.

## 📦 Скрипты

- Backend:
  - `npm run start:dev` — запуск с автоперезапуском
  - `npm run db:seed` — базовые тарифы
  - `npx prisma studio` — веб‑UI для БД
- Frontend:
  - `npm run dev` — dev‑сервер Next.js
  - `npm run build && npm start` — продакшн‑сборка

## 🚀 Деплой (кратко)

- Бэкенд — Node.js сервис за Nginx, переменные окружения как в `.env`.
- Фронтенд — статика Next.js (`npm run build`), reverse‑proxy к API.
- БД — управляемый PostgreSQL (или контейнер).
