# Panduan Instalasi Lengkap (Custom Deployment)

Dokumentasi ini merangkum seluruh proses instalasi **Cabinet SaaS Boilerplate** untuk deployment instans kedua (atau lebih) di server VPS yang sudah memiliki Nginx dan PHP-FPM. Panduan ini mencakup penyesuaian port, database, environment, dan konfigurasi Web Server agar tidak terjadi konflik data maupun *routing* dengan instalasi yang sudah berjalan.

---

## 1. Prasyarat Domain

Karena aplikasi ini menggunakan skema arsitektur *Subdomain Based Routing* (`{tenant}.domain.com`), **WAJIB** menggunakan top-level domain yang berbeda dari instalasi utama untuk setiap *clone* aplikasi baru (Misalnya: `saas-baru.com`). Hal ini penting agar *wildcard* Nginx (`*.saas-baru.com`) tidak tumpang tindih dengan domain SaaS utama Anda.

## 2. Clone Repository & Install Dependencies

Clone repository ke folder yang berbeda (misalnya `/var/www/html/apps/saas2`):
```bash
git clone https://github.com/mutihakim/family2.git /var/www/html/apps/saas2
cd /var/www/html/apps/saas2/project

# Install dependensi backend
composer install --no-interaction --prefer-dist

# Install dependensi frontend
npm install

# Install dependensi layanan WhatsApp
cd ../services/whatsapp
npm install
cd ../../project
```

---

## 3. Database PostgreSQL 🗄️

Anda wajib membuat *database* dan *user* PostgreSQL yang berbeda untuk setiap aplikasi:

```sql
# Login ke postgres
sudo -u postgres psql

# Buat set kredensial baru
CREATE USER saas_user2 WITH PASSWORD 'saas_pass2';
CREATE DATABASE saas_core2 OWNER saas_user2;
GRANT ALL PRIVILEGES ON DATABASE saas_core2 TO saas_user2;
\q
```

---

## 4. Port Services 🚦

Jika instalasi pertama menggunakan port `8095` dan `3025`, Anda wajib menggeser port internal yang bentrok pada instalasi baru ini agar tidak terjadi *Address already in use*, misalnya:
- **Port 8096** - Reverb internal-only (diproxy Nginx via `/app`)
- **Port 3026** - WhatsApp service

Untuk hardening produksi:
- App utama tetap masuk lewat **Nginx + PHP-FPM**, bukan PM2 web server.
- Docs site dipublish sebagai **static files** hasil `vitepress build`, lalu diserve langsung oleh Nginx.

---

## 5. Environment Variables (.env) ⚙️

Salin konfigurasi dasar `.env`:
```bash
cp .env.example .env
php artisan key:generate
```

Ubah parameter krusial di file `.env` di dalam folder `/project/`:
```env
APP_NAME="SaaS Boilerplate 2"
APP_URL=https://saas-baru.com
APP_DOMAIN=saas-baru.com

DB_DATABASE=saas_core2
DB_USERNAME=saas_user2
DB_PASSWORD=saas_pass2

# Reverb Connection (public hostname + internal bind)
BROADCAST_DRIVER=reverb
REVERB_HOST=saas-baru.com
REVERB_PORT=443
REVERB_SCHEME=https
REVERB_SERVER_HOST=127.0.0.1
REVERB_SERVER_PORT=8096

# Sanctum Domain harus mendaftarkan domain utama dan wildard barunya
SANCTUM_STATEFUL_DOMAINS="localhost,127.0.0.1,saas-baru.com,*.saas-baru.com"

# Konfigurasi WhatsApp
WHATSAPP_SERVICE_ENABLED=true
WHATSAPP_SERVICE_URL=http://127.0.0.1:3026

# REDIS (Opsional jika Anda menggunakan 1 server Redis yang sama)
REDIS_PREFIX=saas2_database_
```

---

## 6. WhatsApp Service 📱

Agar layanan WhatsApp internal tidak memutus jalur pengiriman notifikasi instans lainnya, ubah file `/services/whatsapp/.env`:

```env
PORT=3026
APP_CALLBACK_URL=https://saas-baru.com
WHATSAPP_INTERNAL_TOKEN=change-me-to-secure-token
```

---

## 7. Session, Cache, & Redis 🗃️

- **File Driver**: Mengingat folder *clone* ini berbeda path sistem operasi dari app utama, konfigurasi bawaan `SESSION_DRIVER=file` dan `CACHE_DRIVER=file` tidak akan saling bentrok ukurannya maupun filenya.
- **Shared Session Cookie**: Pastikan variabel `SESSION_DOMAIN=.saas-baru.com` (*ditambahkan titik di depan*) sudah dipasang di `.env` agar sesi login pengguna menyeberang dengan mulus ke dashboard tenant (`tenant.saas-baru.com`).
- **Redis Driver**: JIka Anda memutuskan me-manage cache dalam Redis Server (`127.0.0.1:6379`), instalasi kedua akan saling mengenali dan menghapus sesi apabila Anda lupa mengganti *Key Prefix*. Maka **pastikan `REDIS_PREFIX=namaunik_` berbeda di pengaturan `.env`**.

---

## 8. Web Server Configuration (Nginx) 🌐

Anda harus membuat *Virtual Host* Nginx baru di `/etc/nginx/sites-available/saas-baru.com`. Nginx menjadi satu-satunya entrypoint publik untuk domain utama, wildcard tenant, dan docs.

### Contoh Blok Nginx
```nginx
# Tenant Subdomains - HTTPS (*.saas-baru.com)
server {
    server_name *.saas-baru.com saas-baru.com;
    root /var/www/html/apps/saas2/project/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_pass unix:/run/php/php8.3-fpm-family.sock;
    }

    location /app {
        proxy_pass http://127.0.0.1:8096;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    server_name docs.saas-baru.com;
    root /var/www/html/apps/saas2/docs/.vitepress/dist;
    index index.html;

    location / {
        try_files $uri $uri.html $uri/ =404;
    }
}
```

---

### Contoh Konfigurasi Instansi Kedua (Studi Kasus: Toko)

Untuk instalasi **Toko (sahstore.my.id)** yang baru saja kita lakukan, berikut adalah parameter yang digunakan:

| Parameter | Nilai (Toko) | Keterangan |
| :--- | :--- | :--- |
| **Domain** | `sahstore.my.id` | Berbeda dari `appsah.my.id` |
| **DB Name** | `toko_core` | Database PostgreSQL baru |
| **Port Reverb** | `8096` | Port WebSocket Toko |
| **Port WhatsApp** | `3026` | Port Layanan WhatsApp Toko |
| **Docs Output** | `docs/.vitepress/dist` | Static files untuk Nginx |

---

## 9. Build Frontend, Migrasi & Menjalankan PM2

Jika file konfigurasi telah siap, eksekusi migrasi dari backend dan build static content.

```bash
# Lakukan Migrasi Penuh
php artisan migrate:fresh --seed --force

# Rendering React Application
npm run build

# Menyiapkan Docs (Pastikan base url = '/' dalam config.ts bila dideploy di root domain)
npm run docs:build
```

### Konfigurasi PM2 Process Name

Karena PM2 mengabaikan direktori jika mendapati proses dengan *"nama yang sama"*, Anda harus memperjelas penamaan proses (contoh `toko-*`) pada `ecosystem.config.cjs` maupun config lainnya, lalu perbarui *Arguments/Port*-nya:

1. **ecosystem.config.cjs**: Ubah Reverb (`toko-reverb`, `--port=8096`) dan Queue Worker (`toko-queue-worker`).
2. **services/whatsapp/pm2.config.js**: Ganti nama `toko-whatsapp`, serta perbarui `PORT=3026` dan `CALLBACK_URL`.

Jalankan serentak untuk membangkitkan instance Aplikasi Kedua:
```bash
pm2 start ecosystem.config.cjs
cd ../services/whatsapp && pm2 start pm2.config.js

pm2 save
```

Setelah `npm run docs:build`, cukup `reload` Nginx agar static docs baru tersaji. Tidak perlu PM2 app tambahan untuk docs.

---

## 10. Troubleshooting & Tips (Migrasi/Kloning)

Berikut adalah beberapa kendala umum yang ditemukan saat melakukan kloning proyek ke instansi baru:

### 1. Missing Dependencies (Vendor & Node Modules)
Pastikan folder `vendor` dan `node_modules` tersedia di setiap sub-folder aplikasi (`project/`, `velzon/Saas/`, `services/whatsapp/`). Jika melakukan kloning manual, Anda wajib menjalankan `composer install` dan `npm install`, atau menyalinnya secara rekursif (`cp -r`) dari instansi yang sudah ada.

### 2. Izin Akses Folder (Permissions)
Web server (User `www-data`) harus memiliki hak akses tulis pada folder berikut agar tidak terjadi Error 500:
```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### 3. Kendala Database SQLite Bersama
Jika dua instansi berbagi satu file SQLite (misal untuk demo Velzon), pastikan file `.sqlite` dan folder `database/` tempat file itu berada dimiliki oleh `www-data` agar bisa dibaca dan ditulis:
```bash
sudo chown www-data:www-data /path/to/database/database.sqlite
sudo chmod 664 /path/to/database/database.sqlite
```

### 4. Konfigurasi Reverb (WebSocket)
Untuk hardening ingress, gunakan pemisahan **public hostname** dan **internal bind**:
- **Public/App config**: `REVERB_HOST=domain.com`, `REVERB_PORT=443`, `REVERB_SCHEME=https`.
- **Internal server bind**: `REVERB_SERVER_HOST=127.0.0.1`, `REVERB_SERVER_PORT=8096`.
- Browser harus terkoneksi ke `wss://domain.com/app/...`, bukan ke port publik `:8096`.
- Setelah mengubah `.env`, jalankan `php artisan config:clear` atau `php artisan config:cache`, lalu restart PM2 Reverb.

### 5. WhatsApp Service Callback
Pastikan `WHATSAPP_SERVICE_URL` di `.env` aplikasi utama mengarah ke port yang benar (misal `3026`) dan gunakan IP lokal (`127.0.0.1`) agar lebih cepat dan stabil.
