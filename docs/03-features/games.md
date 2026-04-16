# 03 Features - Games Module

## 1) Ringkasan

Games adalah area hiburan dan belajar untuk member tenant. Iterasi saat ini mengaktifkan tiga surface utama:

- Math Game di route `/games/math` dengan flow `Pilih Operator -> Setup & Grid Angka -> Sesi Soal -> Ringkasan Hasil`
- Vocabulary Game di route `/games/vocabulary` dengan flow `Pilih Bahasa/Kategori/Hari -> Learn/Practice -> Sesi Latihan -> Ringkasan Hasil`
- Curriculum Game di route `/games/curriculum` dengan flow `Pilih Unit -> Ambil Deck Soal -> Jawab MCQ -> Ringkasan Hasil`

Backend game sekarang memakai model Eloquent per entitas game dan shared session service untuk menyimpan histori sesi secara konsisten.

## 2) Arsitektur Domain

| Entitas | File / Tabel | Peran |
|---|---|---|
| Math Stats | `tenant_game_math_stats` | Statistik benar/salah dan streak per pasangan angka |
| Math Settings | `tenant_game_math_settings` | Threshold mastery dan default setup per operator |
| Shared Game Sessions | `tenant_game_sessions` | Riwayat sesi Math Game selesai |
| Vocabulary Words | `tenant_game_vocabulary_words` | Bank kata global/tenant untuk latihan vocabulary |
| Vocabulary Stats | `tenant_game_vocabulary_progress` | Statistik benar/salah, streak, dan status mastered per kata |
| Vocabulary Settings | `tenant_game_vocabulary_settings` | Threshold mastery, target jumlah soal practice, timer practice, arah terjemahan, dan preferensi mode/TTS per bahasa |
| Vocabulary Sessions | `tenant_game_vocabulary_sessions` | Riwayat sesi Vocabulary Game selesai |
| Curriculum Units | `curriculum_units` | Katalog unit belajar global/tenant dengan `row_version` + soft delete |
| Curriculum Questions | `curriculum_questions` | Bank soal MCQ global/tenant per unit dengan distractor kontekstual |
| Curriculum Entitlements | `tenant_curriculum_entitlements` | Grant akses per tenant untuk user tertentu atau scope fase/kelas/mapel |
| Shared Session Service | `project/app/Services/Games/GameSessionService.php` | Hitung skor persen dan simpan sesi game via Eloquent |
| Math Service | `project/app/Services/Games/MathGameService.php` | Kontrak domain Math Game |
| Vocabulary Service | `project/app/Services/Games/VocabularyGameService.php` | Kontrak domain Vocabulary Game |
| Curriculum Services | `project/app/Services/Games/Curriculum/*` | Katalog unit, deck soal, import CSV, entitlement, dan history sesi |

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

Aturan gameplay Vocabulary yang aktif:

- Jawaban salah mereset `correct_streak` ke `0`; `max_streak` tetap menyimpan rekor historis tertinggi.
- Status `is_mastered` dihitung dari `correct_streak >= mastered_threshold`, sehingga kata bisa turun kembali ke status belum mastered.
- `practice` memakai target jumlah soal dari settings per bahasa dan boleh selesai lebih awal jika semua kata pada kombinasi `language + category + day` sudah mastered di tengah sesi.
- `memory_test` mengabaikan `isDayMastered` sebagai auto-finish. Target sesi di-override menjadi `jumlah effective words pada hari aktif`, sehingga tiap kata diuji satu kali per sesi sebelum summary muncul.
- Sesi `memory_test` juga disimpan ke history Vocabulary seperti sesi `practice`.

Response `GET /config` untuk Vocabulary juga memuat `mastered_days` per `language -> category -> [day]`.
Nilai ini wajib dihitung dari effective word set yang dipakai halaman practice (`global + override tenant` setelah dedupe), bukan dari jumlah row mentah tabel vocabulary.

### Curriculum Game

Endpoint berada di bawah `/api/v1/tenants/{tenant}/games/curriculum`.

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/config` | Opsi jumlah soal + unit yang benar-benar bisa diakses member |
| `GET` | `/units/{unitId}/questions?limit=10` | Ambil deck soal acak untuk satu unit |
| `POST` | `/attempt` | Validasi satu jawaban terhadap satu soal |
| `POST` | `/session/finish` | Simpan ringkasan sesi Curriculum ke `tenant_game_sessions` |
| `GET` | `/history?limit=10` | Riwayat sesi Curriculum member aktif |
| `GET` | `/admin/units` | Daftar unit global + tenant untuk surface admin/API |
| `POST` | `/admin/units` | Buat unit tenant baru |
| `PATCH` | `/admin/units/{unit}` | Update unit tenant dengan OCC `row_version` |
| `DELETE` | `/admin/units/{unit}` | Soft delete unit tenant |
| `GET` | `/admin/units/{unitId}/questions` | List soal unit |
| `POST` | `/admin/units/{unitId}/questions` | Tambah satu soal |
| `POST` | `/admin/units/{unitId}/questions/import` | Import bank soal CSV |
| `PATCH` | `/admin/questions/{question}` | Update soal dengan OCC `row_version` |
| `DELETE` | `/admin/questions/{question}` | Soft delete soal tenant |
| `GET` | `/admin/entitlements` | List entitlement curriculum tenant |
| `POST` | `/admin/entitlements` | Grant entitlement curriculum |
| `DELETE` | `/admin/entitlements/{entitlement}` | Revoke entitlement curriculum |

Aturan Curriculum yang aktif:

- `curriculum_units` dan `curriculum_questions` mendukung data global (`tenant_id = null`) dan tenant-specific.
- Entitlement memakai union access: grant user-specific menang, atau grant tenant-scope berdasarkan kombinasi `subject + educational_phase? + grade?`.
- Update unit/soal memakai `row_version` dan mengembalikan `409 VERSION_CONFLICT` jika stale.
- Semua create/update/delete/import/grant/revoke menulis `activity_logs`.
- Import resmi v1 adalah CSV; kolom minimal `question_text`, `option_a..option_d`, `correct_answer`.
- Seeder pilot hanya mengaktifkan satu mapel sempit (`Matematika SD Kelas 4`) dengan distractor yang masih satu konteks pertanyaan, tidak random lintas domain.

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
- Curriculum Game v1 kini mengikuti pola Vocabulary: composer page tipis, controller hook terpisah, `setup -> countdown -> practice -> summary`, history terpisah, dan reuse primitive shared (`GameSessionHeader`, `GameTimerProgress`, `GameCountdownOverlay`, `GameSummaryCard`, `GameHistoryView`).
- Submenu Vocabulary `Mastered`, `History`, dan `Settings` sekarang aktif dan menampilkan data nyata, bukan placeholder statis.
- Practice mode Vocabulary sekarang memiliki timer per soal yang dikonfigurasi dari settings per bahasa.
- Practice mode Vocabulary juga memiliki target jumlah soal per bahasa. Jika kata yang belum mastered lebih sedikit dari target, kata tersebut diulang sampai target soal terpenuhi atau seluruh kombinasi kategori-hari benar-benar mastered di tengah sesi.
- Practice screen Vocabulary dan Curriculum harus menjaga daftar opsi jawaban tetap terbaca pada viewport pendek mode PWA mobile standalone; area opsi wajib bisa scroll di atas `safe-area-inset-bottom` tanpa memotong tombol paling bawah.
- Summary/result screen Vocabulary juga wajib punya scroll internal pada viewport pendek mode PWA mobile standalone, sehingga CTA `change setup`, `play again`, dan `memory test` tetap bisa diakses.
- Memory Test Vocabulary kini memakai target sesi sebesar total effective words pada hari aktif, bukan `default_question_count`, dan tidak berhenti hanya karena level sudah mastered sebelum sesi dimulai.
- Settings Vocabulary juga mendukung mode reverse `Bahasa Pilihan -> Indonesia` selain mode default `Indonesia -> Bahasa Pilihan`.
- Halaman Vocabulary `Mastered` kini mendukung filter dan detail translasi untuk English, Arabic, dan Mandarin.
- Chip hari pada setup Vocabulary kini menampilkan badge `🏆` hanya jika seluruh effective words pada kombinasi `member + language + category + day` sudah mencapai threshold mastered.
- Curriculum setup memakai surface `vocab-setup-card` dan floating start action yang sama arah visualnya dengan Vocabulary.
- Curriculum practice kini memiliki timer per soal, countdown sebelum sesi dimulai, counter soal, streak, feedback benar/salah/timeout, dan summary tabel attempt.
- Curriculum Hub card sekarang aktif dari `/games` dan membuka game berbasis unit yang lolos entitlement tenant.

## 5) Batasan Saat Ini

- Game masih memakai tenant member aktif sebagai subjek, belum ada pemilih anak/profil belajar terpisah.
- Histori dan progres game masih disimpan per member tenant, bukan per profil anak khusus.
- Vocabulary masih memakai tabel sesi terpisah (`tenant_game_vocabulary_sessions`), sehingga shared session service saat ini menyatukan logic penyimpanan, bukan tabel histori fisiknya.
- Curriculum belum punya halaman admin web khusus; pengelolaan konten v1 tersedia via API tenant-protected + seeder pilot + import CSV.
- Screenshot docs belum ditambahkan pada iterasi ini karena fokus perubahan masih pada parity gameplay, backend persistence, dan modularisasi frontend/backend.
