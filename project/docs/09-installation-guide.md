# Panduan Instalasi Lengkap (Custom Deployment)

Dokumentasi ini merangkum seluruh proses instalasi Cabinet SaaS Boilerplate untuk deployment instans kedua di server VPS yang sudah memiliki Nginx dan PHP-FPM, dengan penyesuaian port, database, dan proses PM2 agar tidak bentrok dengan instalasi yang sudah ada.

## Daftar Isi
- [Prasyarat Sistem](#prasyarat-sistem)
- [Langkah Instalasi](#langkah-instalasi)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Setup Database & Migrasi](#setup-database-migrasi)
- [Build Frontend & Docs](#build-frontend-docs)
- [Menjalankan Aplikasi dengan PM2](#menjalankan-aplikasi-dengan-pm2)
- [Troubleshooting Tambahan](#troubleshooting-tambahan)

## Prasyarat Sistem
Pastikan port berikut **tersedia** (tidak dipakai oleh aplikasi lain):
- `8015` (Web Application)
- `8016` (Documentation Site)
- `8095` (Reverb WebSocket)
- `3025` (WhatsApp Internal Service)

## Langkah Instalasi

### 1. Clone Repository & Install Dependencies
Clone repository ke folder yang dituju (misalnya `/var/www/html/apps/family2`):
```bash
git clone https://github.com/mutihakim/family.git /var/www/html/apps/family2
cd /var/www/html/apps/family2/project

# Install dependensi backend
composer install --no-interaction --prefer-dist

# Install dependensi frontend
npm install

# Install dependensi layanan WhatsApp
cd ../services/whatsapp
npm install
cd ../../project
```

## Konfigurasi Environment

### 1. Setup Environment Backend
Salin `.env.example` ke `.env` dan buat \`app key\`:
```bash
cp .env.example .env
php artisan key:generate
```

Ubah parameter krusial di file `.env` untuk menghindari bentrok:
```env
APP_NAME="SaaS Boilerplate 2"
APP_URL=http://<IP_SERVER>:8015

# Gunakan kredensial database yang baru
DB_DATABASE=cabinet_core2
DB_USERNAME=cabinet_user2
DB_PASSWORD=cabinet_pass2

# Reverb Connection
BROADCAST_DRIVER=reverb

# Sanctum Domain harus memasukkan IP server dan port 8015
SANCTUM_STATEFUL_DOMAINS="localhost,127.0.0.1,127.0.0.1:8015,localhost:8015,<IP_SERVER>,<IP_SERVER>:8015"

# Konfigurasi Reverb (Ganti Port dan Kredensial)
REVERB_APP_ID=5432102
REVERB_APP_KEY=local_cabinet_key2
REVERB_APP_SECRET=local_cabinet_secret2
REVERB_HOST="<IP_SERVER>"
REVERB_PORT=8095

# Konfigurasi WhatsApp
WHATSAPP_SERVICE_ENABLED=true
WHATSAPP_SERVICE_URL=http://<IP_SERVER>:3025
```

### 2. Setup Environment Layanan WhatsApp
Buka `/services/whatsapp/.env` dan sesuaikan dengan `.env` backend:
```env
PORT=3025
APP_CALLBACK_URL=http://<IP_SERVER>:8015
WHATSAPP_INTERNAL_TOKEN=change-me
```

## Setup Database & Migrasi

Buat database PostgreSQL baru (contoh menggunakan `postgres` user):
```bash
sudo -u postgres psql -c "CREATE USER cabinet_user2 WITH PASSWORD 'cabinet_pass2';"
sudo -u postgres psql -c "CREATE DATABASE cabinet_core2 OWNER cabinet_user2;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cabinet_core2 TO cabinet_user2;"
```

Tambahkan file translasi `auth.json` yang secara tak sengaja ter-ignore oleh Git:
```bash
# resources/js/locales/en/auth.json
{ "login": { "title": "Sign In" }, "register": { "title": "Create Account" } }

# resources/js/locales/id/auth.json
{ "login": { "title": "Masuk" }, "register": { "title": "Buat Akun" } }
```

Jalankan migrasi (gunakan `--force` jika APP_ENV tidak terbaca lokal dengan benar):
```bash
php artisan migrate:fresh --seed --force
```

## Build Frontend & Docs

Sebelum mem-build dokumentasi, pastikan \`base\` di `docs/.vitepress/config.ts` diubah menjadi `'/'` jika ingin disajikan langsung dari \`root\` tanpa subdirectory Nginx.

```bash
npm run build
npm run docs:build
```

## Menjalankan Aplikasi dengan PM2

Karena aplikasi sudah ada di VPS yang sama, ganti nama proses dan konfigurasi port di PM2 agar bisa berjalan bersama-sama:

1. **ecosystem.config.cjs**: Ubah Reverb (`family2-reverb`, `--port=8095`) dan Queue Worker (`family2-queue-worker`).
2. **cabinet-web.config.cjs**: Ubah Web Server menjadi `family2-web`, dan dengarkan ke global network: `args: "serve --host=0.0.0.0 --port=8015"`.
3. **services/whatsapp/pm2.config.js**: Ganti nama \`tenant-whatsapp-service\` ke `family2-whatsapp`, serta perbarui \`PORT\` dan \`CALLBACK_URL\`.
4. Buat file `family2-docs.config.cjs`:
```javascript
module.exports = {
  apps: [{
    name: "family2-docs",
    script: "npx",
    args: "http-server docs/.vitepress/dist -p 8016",
    cwd: __dirname
  }]
};
```

Jalankan semuanya dan hapus file yang rentan konflik jika tersisa di sistem `pm2`:
```bash
pm2 start ecosystem.config.cjs
pm2 start cabinet-web.config.cjs
cd ../services/whatsapp && pm2 start pm2.config.js
cd ../../project && pm2 start family2-docs.config.cjs

pm2 save
```

## Troubleshooting Tambahan

### Nginx Port Collision
Jika Nginx menyebabkan bentrok port `98: Address already in use` karena `0.0.0.0` sudah digunakan oleh PM2 (`artisan serve`), tidak perlu mengonfigurasi blok server Nginx jika aplikasi bisa dijangkau dari IP public langsung kecuali Anda memiliki domain SSL.

### Dokumentasi CSS Tidak Ter-load
Jika Docs terbuka tetapi hanya memuat HTML (404 untuk assets), cek properti `base` di `docs/.vitepress/config.ts`. Ubah `base: '/cabinet/project/docs/.vitepress/dist/'` menjadi `base: '/'` dan lakukan *rebuild*. Karena static server memuat dari `root`, base url relative URL harus berupa `/`.
