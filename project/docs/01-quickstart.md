# 01 - Quickstart

## Prasyarat

- PHP 8.2+
- Composer
- Node.js 20+
- NPM
- PM2 (`npm install -g pm2`)
- PostgreSQL/MySQL/SQLite sesuai `.env`

## Setup Lokal

```bash
composer install
npm install
cd ../services/whatsapp && npm install && cd ../../project
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```

## Menjalankan Aplikasi

Aplikasi SaaS ini membutuhkan 4 komponen untuk berjalan penuh (Web, WebSocket, Queue, dan WhatsApp Node.js). 
Gunakan *background service* PM2:

```bash
pm2 start ecosystem.config.cjs
pm2 start cabinet-web.config.cjs
cd ../services/whatsapp && pm2 start pm2.config.js
```

## Validasi Minimum

```bash
php artisan test
npm run test:e2e
```

## Menjalankan Docs Site

```bash
npm run docs:dev
```

Build static HTML:

```bash
npm run docs:build
```

Output build ada di `docs/.vitepress/dist`.
