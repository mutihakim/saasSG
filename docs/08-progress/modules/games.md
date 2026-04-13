# Progress - Games

Status: `In Progress`  
Last updated: `2026-04-13`  
Owner: `Frontend Team`

## Tujuan Modul

Menjadikan Games sebagai area belajar dan hiburan member tenant yang konsisten dengan shell Velzon superapp, dimulai dari Math Game.

## Progress Terkini

- route `/games` dan `/games/math` tersedia di member area
- Math Game memakai flow operator, setup, angka fokus, sesi soal, dan summary
- statistik pair angka tersimpan di `tenant_game_math_stats`
- riwayat sesi tersimpan di `tenant_game_sessions`
- endpoint stats batch tersedia untuk tabel summary hasil
- UI Math Game memakai React Bootstrap dan class Velzon seperti `Card`, `Button`, `Form.Select`, `Badge`, `ProgressBar`, `btn-soft-*`, dan `avatar-title`
- Math Game dimodularisasi menjadi service backend, composer page tipis, controller hook, utility soal/pair, dan komponen UI terpisah untuk operator, setup, sesi, summary, countdown, dan memory test
- backend games mulai dipindahkan ke model Eloquent (`TenantGameSession`, `TenantGameMathStat`, `TenantGameVocabularyStat`) dan shared `GameSessionService`
- Vocabulary backend kini memiliki service terpisah agar query persistence tidak lagi menumpuk di controller API
- frontend games kini punya shared primitive (`GameFeatureLayout`, `GameFeedbackPopup`, `GameCountdownOverlay`, `useVoiceFeedback`) yang dipakai lintas Math/Vocabulary
- Vocabulary page dipecah menjadi controller hook dan screen component terpisah untuk setup, learn, practice, dan summary
- submenu Vocabulary `mastered/history/settings` kini aktif dengan konten nyata berbasis API dan form pengaturan per bahasa
- feedback praise/encouragement dan popup benar/salah kini diseragamkan lintas Math/Vocabulary agar auto-dismiss dan reset antar-soal konsisten
- Vocabulary kini mendukung timer per soal dan arah terjemahan reverse yang bisa diatur dari settings per bahasa

## Milestone Checklist

- [x] Hub Games tersedia
- [x] Math Game API config/mastered/attempt/session/history tersedia
- [x] Math Game API stats batch tersedia
- [x] Math Game flow utama aktif
- [x] Feedback benar/salah auto-close 2 detik
- [x] Generator soal mengikuti logika legacy untuk pengurangan dan pembagian
- [x] Frontend/backend Math Game dimodularisasi tanpa mengubah kontrak API dan flow UX
- [x] Backend persistence games dimigrasikan ke model Eloquent + shared session service
- [x] Vocabulary API backend dipisah ke service dedicated
- [x] Shared component/hook frontend untuk Math dan Vocabulary diekstrak ke `features/games/shared`
- [x] Vocabulary frontend dipecah dari page monolitik menjadi controller + screen components
- [x] Vocabulary submenu `mastered/history/settings` tidak lagi placeholder
- [ ] Selector anak/profil belajar terpisah dari tenant member aktif
- [ ] E2E smoke untuk Math Game
- [ ] Screenshot docs untuk happy path dan edge state

## Blocker & Dependency

- Belum ada profil anak terpisah; Math Game saat ini memakai tenant member aktif sebagai subjek statistik.

## Next Actions

1. Tambahkan E2E smoke untuk flow Math dan Vocabulary.
2. Tambahkan screenshot docs untuk operator/setup/problem/summary screen.
3. Tambahkan selector anak/profil belajar bila domain child profile sudah tersedia.

## Referensi

- Feature docs: `docs/03-features/games.md`
- API docs: `docs/api-reference.md`
