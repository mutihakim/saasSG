# Progress - Games

Status: `In Progress`  
Last updated: `2026-04-11`  
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

## Milestone Checklist

- [x] Hub Games tersedia
- [x] Math Game API config/mastered/attempt/session/history tersedia
- [x] Math Game API stats batch tersedia
- [x] Math Game flow utama aktif
- [x] Feedback benar/salah auto-close 2 detik
- [x] Generator soal mengikuti logika legacy untuk pengurangan dan pembagian
- [ ] Selector anak/profil belajar terpisah dari tenant member aktif
- [ ] E2E smoke untuk Math Game
- [ ] Screenshot docs untuk happy path dan edge state

## Blocker & Dependency

- Belum ada profil anak terpisah; Math Game saat ini memakai tenant member aktif sebagai subjek statistik.

## Next Actions

1. Tambahkan selector anak/profil belajar bila domain child profile sudah tersedia.
2. Tambahkan E2E smoke untuk flow Math Game.
3. Tambahkan screenshot docs untuk operator, problem, dan summary screen.

## Referensi

- Feature docs: `docs/03-features/games.md`
- API docs: `docs/api-reference.md`
