# 03 Features - Games Module

## 1) Ringkasan

Games adalah area hiburan dan belajar untuk member tenant. Iterasi saat ini mengaktifkan Math Game di route `/games/math` dengan flow:

`Pilih Operator -> Setup & Grid Angka -> Sesi Soal -> Ringkasan Hasil`

Math Game memakai React + Inertia di frontend dan menyimpan histori pair angka per tenant member di backend.

## 2) Arsitektur Domain

| Entitas | File / Tabel | Peran |
|---|---|---|
| Math Stats | `tenant_game_math_stats` | Statistik benar/salah dan streak per pasangan angka |
| Game Sessions | `tenant_game_sessions` | Riwayat sesi game selesai |
| API Controller | `project/app/Http/Controllers/Api/V1/Games/MathGameApiController.php` | Kontrak JSON Math Game |
| React Page | `project/resources/js/features/games/MathGamePage.tsx` | Flow UI Math Game |
| Game Hook | `project/resources/js/features/games/hooks/useMathGame.ts` | Generator soal, timer, jawaban, streak |

## 3) Database & API

Endpoint berada di bawah `/api/v1/tenants/{tenant}/games/math`.

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/config` | Operator, mode, opsi range, jumlah soal, timer, threshold mastery |
| `GET` | `/mastered?operator=+` | Pair yang sudah mencapai streak mastery |
| `POST` | `/stats` | Statistik batch untuk daftar pair |
| `POST` | `/attempt` | Simpan hasil satu jawaban dan update streak pair |
| `POST` | `/session/finish` | Simpan ringkasan satu sesi |
| `GET` | `/history?limit=10` | Riwayat sesi Math Game |

`POST /stats` menerima payload:

```json
{
  "pairs": [
    { "operator": "+", "angka_pilihan": 5, "angka_random": 7 }
  ]
}
```

Response `data.stats` dikunci dengan format `{operator}|{angka_pilihan}|{angka_random}`.

## 4) UI / UX

- Math Game dibuka dari `/games`, lalu masuk ke `/games/math`.
- Layar operator memakai tile berbasis class Velzon/Bootstrap (`btn-soft-*`, `avatar-title`, `card-animate`).
- Setup memakai `Form.Select` untuk mode, range angka, jumlah soal, dan timer.
- Angka fokus dipilih lewat grid 1-10 berdasarkan range A.
- Layar soal menampilkan nomor soal, mode, streak, timer progress, soal, jawaban, dan numpad.
- Feedback benar/salah memakai popup 2 detik dan TTS Bahasa Indonesia jika browser mendukung.
- Ringkasan akhir menampilkan skor, benar, best streak, tabel soal, jawaban user, status, histori `% benar`, dan streak pair.

## 5) Batasan Saat Ini

- Math Game memakai tenant member aktif sebagai subjek, belum ada pemilih anak terpisah.
- Histori pair disimpan per member tenant, bukan per profil anak khusus.
- Screenshot docs belum ditambahkan pada iterasi ini karena fokus perubahan adalah parity gameplay dan API.
