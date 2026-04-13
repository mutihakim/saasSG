# 03 Features - Games Module

## 1) Ringkasan

Games adalah area hiburan dan belajar untuk member tenant. Iterasi saat ini mengaktifkan dua surface utama:

- Math Game di route `/games/math` dengan flow `Pilih Operator -> Setup & Grid Angka -> Sesi Soal -> Ringkasan Hasil`
- Vocabulary Game di route `/games/vocabulary` dengan flow `Pilih Bahasa/Kategori/Hari -> Learn/Practice -> Sesi Latihan -> Ringkasan Hasil`

Backend game sekarang memakai model Eloquent per entitas game dan shared session service untuk menyimpan histori sesi secara konsisten.

## 2) Arsitektur Domain

| Entitas | File / Tabel | Peran |
|---|---|---|
| Math Stats | `tenant_game_math_stats` | Statistik benar/salah dan streak per pasangan angka |
| Math Settings | `tenant_game_math_settings` | Threshold mastery dan default setup per operator |
| Shared Game Sessions | `tenant_game_sessions` | Riwayat sesi Math Game selesai |
| Vocabulary Words | `tenant_game_vocabulary_words` | Bank kata global/tenant untuk latihan vocabulary |
| Vocabulary Stats | `tenant_game_vocabulary_progress` | Statistik benar/salah, streak, dan status mastered per kata |
| Vocabulary Settings | `tenant_game_vocabulary_settings` | Threshold mastery, timer practice, arah terjemahan, dan preferensi mode/TTS per bahasa |
| Vocabulary Sessions | `tenant_game_vocabulary_sessions` | Riwayat sesi Vocabulary Game selesai |
| Shared Session Service | `project/app/Services/Games/GameSessionService.php` | Hitung skor persen dan simpan sesi game via Eloquent |
| Math Service | `project/app/Services/Games/MathGameService.php` | Kontrak domain Math Game |
| Vocabulary Service | `project/app/Services/Games/VocabularyGameService.php` | Kontrak domain Vocabulary Game |

## 3) Database & API

### Math Game

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

### Vocabulary Game

Endpoint berada di bawah `/api/v1/tenants/{tenant}/games/vocabulary`.

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/config` | Bahasa, mode, arah terjemahan, kategori, hari, default threshold, dan default timer |
| `GET` | `/mastered?limit=500&language=english` | Daftar kata mastered member, bisa difilter per bahasa |
| `GET` | `/words?language=english&category=Buah&day=1` | Kata efektif per hari + progress map member |
| `GET` | `/pool?language=english&category=Buah` | Pool kata efektif lintas hari untuk quiz/opsi |
| `POST` | `/attempt` | Simpan hasil satu jawaban dan update progress kata |
| `POST` | `/session/finish` | Simpan ringkasan satu sesi vocabulary |
| `GET` | `/history?limit=10&language=english` | Riwayat sesi Vocabulary Game |
| `GET` | `/settings?language=english` | Ambil pengaturan vocabulary per bahasa |
| `POST` | `/settings` | Simpan pengaturan vocabulary per bahasa |

`POST /attempt` menerima payload:

```json
{
  "word_id": 10,
  "language": "english",
  "is_correct": true,
  "current_streak": 2
}
```

## 4) UI / UX

- Math Game dibuka dari `/games`, lalu masuk ke `/games/math`.
- Frontend Games sekarang memakai struktur per-modul `hub/`, `math/`, `vocabulary/`, `story/`, `tahfiz/`, dan `shared/`.
- Shared folder menampung primitive lintas game seperti layout feature, feedback popup, countdown overlay, dan voice feedback hook.
- Layar operator memakai tile berbasis class Velzon/Bootstrap (`btn-soft-*`, `avatar-title`, `card-animate`).
- Setup memakai `Form.Select` untuk mode, range angka, jumlah soal, dan timer.
- Angka fokus dipilih lewat grid 1-10 berdasarkan range A.
- Layar soal menampilkan nomor soal, mode, streak, timer progress, soal, jawaban, dan numpad.
- Feedback benar/salah, praise, dan encouragement sekarang memakai kontrak shared yang sama lintas Math/Vocabulary: popup auto-hide sekitar 1.2 detik dan dipaksa hilang saat prompt/soal berikutnya muncul.
- Ringkasan akhir menampilkan skor, benar, best streak, tabel soal, jawaban user, status, histori `% benar`, dan streak pair.
- Vocabulary Game kini dipecah menjadi controller hook dan screen component terpisah untuk setup, learn, practice, dan summary agar arsitekturnya sejalan dengan Math Game.
- Submenu Vocabulary `Mastered`, `History`, dan `Settings` sekarang aktif dan menampilkan data nyata, bukan placeholder statis.
- Practice mode Vocabulary sekarang memiliki timer per soal yang dikonfigurasi dari settings per bahasa.
- Settings Vocabulary juga mendukung mode reverse `Bahasa Pilihan -> Indonesia` selain mode default `Indonesia -> Bahasa Pilihan`.

## 5) Batasan Saat Ini

- Game masih memakai tenant member aktif sebagai subjek, belum ada pemilih anak/profil belajar terpisah.
- Histori dan progres game masih disimpan per member tenant, bukan per profil anak khusus.
- Vocabulary masih memakai tabel sesi terpisah (`tenant_game_vocabulary_sessions`), sehingga shared session service saat ini menyatukan logic penyimpanan, bukan tabel histori fisiknya.
- Screenshot docs belum ditambahkan pada iterasi ini karena fokus perubahan masih pada parity gameplay, backend persistence, dan modularisasi frontend/backend.
