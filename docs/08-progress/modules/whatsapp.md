# Progress - WhatsApp Integration

Status: `Done`  
Last updated: `2026-04-13`  
Owner: `Integration Team`

## Tujuan Modul

Menyediakan kapabilitas integrasi WhatsApp berbasis WebSockets (via Laravel Reverb) secara real-time untuk tiap tenant.

## Milestone Checklist

- [x] Node.js Webhook & QR Session tracking terhubung.
- [x] Sinkronisasi status *Connecting* dan mitigasi Timeout Callback NodeJS.
- [x] Transisi HTTP Polling menuju Laravel Reverb WebSockets.
- [x] Broadcast Event (`WhatsappMessageReceived`, `WhatsappSessionStateUpdated`) beroperasi penuh.
- [x] Reverb 403 Forbidden payload dan payload limit resolution.

## Progress Terkini

- Infrastruktur frontend Inertia React _fully functional_ menggunakan `window.Echo`.
- Otomasi auto-load pesan chat dan sinkronisasi sesi telah di-_deploy_ dan diuji end-to-end tanpa error 500/403.
- Endpoint pesan chat kini memakai cursor pagination batch 15 (`before_id`, `has_more`, `next_before_id`) dan UI menyediakan tombol **Load more** (EN/ID) dengan posisi scroll stabil.
- Handling `401` di layar chat diperketat: stop chain request, tampilkan notif sesi expired, dan redirect ke login dengan `intended` URL.
- Proses `reverb:start` + `queue:work` sudah disiapkan untuk auto-run melalui PM2 profile `ecosystem.config.cjs`.
- Hardening ingress produksi diselaraskan: Reverb dijalankan internal-only (`127.0.0.1`) dan jalur publik tetap melalui proxy Nginx `/app`, sehingga browser tenant tetap memakai `wss://{host}/app`.
- Auto-reply command incoming (`/` dan `!`) untuk `ping` dan `help` sudah aktif dari callback Laravel, dengan fallback help untuk command tidak dikenal.
- UI WhatsApp Settings direfresh: QR/Handshake digabung ke card status sesi, plus card baru `Command Guide` (EN/ID).
- Guard bisnis lintas tenant aktif: satu `connected_jid` hanya boleh aktif di satu tenant (policy reject newcomer), dengan metadata conflict `jid_conflict` untuk observabilitas UI.
- Safety net database ditambahkan via unique partial index `connected_jid IS NOT NULL`, termasuk cleanup migrasi duplikasi existing (`jid_conflict_migration`, keep tenant terlama).
- Saat conflict runtime, tenant newcomer kini juga otomatis ditrigger `removeSession` ke service secara best effort agar auth cache service ikut dibersihkan.
- Konfigurasi produksi Family2/Sanjo mulai diarahkan ke broker internal bersama `whatsapp-broker` (`127.0.0.1:3030`) untuk mengurangi duplikasi proses Chromium, sementara service lama tetap disimpan sebagai fallback migrasi.
- Halaman WhatsApp Settings Family2 kini mengikat ulang listener Echo saat koneksi Reverb baru siap atau reconnect, sehingga update QR/status kembali sinkron secara realtime tanpa polling fallback.
- Jalur chat Family2 setelah migrasi broker sudah di-hardening: callback masuk kini menormalkan `payload.text`, pengiriman ke `@lid` diterima, dan insert outgoing message dibuat idempoten agar callback broker tidak lagi memicu duplicate-key error saat kirim ke chat yang sama.
- Kode `whatsapp-broker` sudah dimodularisasi: bootstrap server, runtime engine, callback gateway, auth/token guard, presenter payload, dan route adapter per project (`sanjo`, `nestnote`, `renoruma`, `archflow`, `wa-bot`) dipisah agar penambahan project baru tidak lagi menumpuk di satu file.
- App Laravel Family2 kini punya command audit `php artisan whatsapp:legacy:readiness`, panduan `docs/guide/whatsapp-legacy-cleanup.md`, dan script patch `project/scripts/whatsapp-legacy-cleanup.sh` untuk gating serta eksekusi cleanup service WhatsApp lama per project.

## Inventory Legacy WhatsApp (Family2/Sanjo)

- **PM2 Process**: `sanjo-whatsapp` (id 9, stopped).
- **Service Directory**: `/var/www/html/apps/family2/services/whatsapp/`.
- **Runtime Auth**: `/var/www/html/apps/family2/services/whatsapp/wa-auth/`.
- **Port**: 3026 (legacy default was 3010).

## Blocker & Dependency

- Blocker: (Tidak ada)
- Dependency: PM2 `whatsapp-broker` serta PM2 app `sanjo-reverb` dan `sanjo-queue-worker` wajib jalan di _background production_; Nginx wajib mempertahankan proxy `/app` dan route `/broadcasting/auth`.

## Next Actions

1. Jalankan observasi stabilitas Family2 lalu gunakan `php artisan whatsapp:legacy:readiness --tenant=family2` sebagai gate sebelum mematikan fallback lama.
2. Cleanup service WhatsApp lama per project satu per satu memakai panduan `docs/guide/whatsapp-legacy-cleanup.md`.
3. Lanjutkan migrasi project berikutnya ke broker modular setelah checklist cleanup selesai.

## Referensi PR/Issue/Test

- Feature docs: `docs/03-features/whatsapp.md`
- Entry points:
  - `/var/www/html/services/whatsapp-broker/src/index.js`
  - `services/whatsapp/src/index.js` (fallback migrasi)
  - `resources/js/Pages/Tenant/WhatsApp/Chats.tsx`
  - `resources/js/Pages/Tenant/WhatsApp/Settings.tsx`
  - `ecosystem.config.cjs`
