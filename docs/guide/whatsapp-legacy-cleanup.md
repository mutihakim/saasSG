# Panduan: Cleanup Legacy WhatsApp per Project

Dokumen ini dipakai setelah Family2 stabil di broker modular bersama. Tujuannya adalah mematikan service WhatsApp lama per project secara bertahap, dengan blast radius kecil dan rollback sederhana.

## Checklist Family2 Sebelum Cleanup

- [ ] Jalankan `php artisan whatsapp:legacy:readiness --tenant=family2` dan pastikan hasil `readiness: PASS`.
- [ ] Pastikan `WHATSAPP_SERVICE_ENABLED=true`.
- [ ] Pastikan `WHATSAPP_SERVICE_URL` mengarah ke broker bersama (`127.0.0.1:3030` atau hostname broker), bukan service lama `:3010`.
- [ ] Pastikan tidak ada `stale_connecting_sessions` dan tidak ada `jid_conflicts`.
- [ ] Pastikan traffic masuk/keluar normal selama masa observasi yang disepakati.
- [ ] Validasi runtime di server: PM2 broker, queue worker, Reverb, dan proxy Nginx `/app` sehat.
- [ ] Pastikan rollback sederhana tersedia: service legacy masih bisa dinyalakan ulang tanpa perubahan schema/data tambahan.

## Checklist Cleanup Service Lama per Project

- [ ] Inventaris proses runtime lama: PM2 app name, working directory, auth dir, port, env file, log file.
- [ ] Inventaris integrasi lama: webhook callback, cron/scheduler, worker, service unit, supervisor/systemd, reverse proxy, dan health check.
- [ ] Pastikan project target sudah mengarah ke broker modular, bukan binary/service WA lama.
- [ ] Bekukan perubahan non-esensial pada project target selama jendela cleanup.
- [ ] Stop autostart service lama dulu, tetapi jangan hapus artefaknya.
- [ ] Observasi broker modular setelah stop autostart; pastikan session restore, QR refresh, incoming callback, dan outgoing send tetap normal.
- [ ] Jika stabil, baru hapus wiring runtime lama: PM2 entry, service unit, cron, env var yang tidak dipakai, dan dokumentasi usang.
- [ ] Simpan catatan tanggal cleanup, project, owner, dan rollback point.

## Checklist Migrasi Project Berikutnya

- [ ] Tambahkan route adapter project baru ke broker modular.
- [ ] Samakan kontrak callback internal dengan Family2.
- [ ] Arahkan config project ke broker bersama lebih dulu, tanpa mematikan service lama.
- [ ] Uji alur minimum: connect QR, reconnect, incoming callback, outgoing send, conflict guard, dan remove session.
- [ ] Jalankan masa observasi singkat.
- [ ] Setelah lolos observasi, ulangi checklist cleanup service lama untuk project tersebut.

## Eksekusi yang Sudah Bisa Dilakukan dari Repo Ini

Command audit dan eksekusi tersedia di app Laravel:

```bash
# Audit readiness
php artisan whatsapp:legacy:readiness --tenant=family2

# Eksekusi cleanup (jika sudah PASS)
./project/scripts/whatsapp-legacy-cleanup.sh
```

Command audit ini memeriksa readiness berbasis config + database:

- target service saat ini masih legacy atau sudah broker,
- apakah masih ada session `connecting` yang stale,
- apakah masih ada conflict `connected_jid`,
- ringkasan aktivitas pesan masuk/keluar pada window observasi.

Catatan: command ini tidak bisa menggantikan pengecekan runtime eksternal untuk PM2, Nginx, queue, dan Reverb.
