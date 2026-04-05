# AGENTS.md - Docs-First + Progress-First Workflow for `project`

## Mandatory Note

`project/AGENTS.md` adalah source of truth untuk workflow agent AI yang bekerja di folder `project`.

Dokumentasi produk/arsitektur yang wajib dijadikan acuan berada di root repository, yaitu `/docs`, bukan di `project/docs`.

## 1) Mission & Scope

Panduan ini berlaku untuk semua agent AI yang mengubah kode, test, atau dokumentasi aplikasi di folder `project`.

Tujuan utama:

- Selalu bekerja berdasarkan dokumentasi di `/docs` (docs-driven).
- Menjaga konsistensi standar arsitektur, entitlement, UI, dan testing yang sudah berjalan.
- Memastikan dokumen fitur dan progress modul ikut diperbarui pada perubahan yang relevan.

## 2) Mandatory Read Order

Sebelum implementasi perubahan, agent wajib membaca dokumen root `/docs` yang relevan:

1. `docs/overview.md`
2. `docs/architecture.md`
3. `docs/03-features/{rbac,i18n,subscription}.md` sesuai modul yang disentuh
4. `docs/testing-quality.md`
5. `docs/extension-guide.md`
6. `docs/08-progress/index.md` dan `docs/08-progress/modules/<module>.md` terkait

Tambahan wajib sesuai konteks perubahan:

- Jika perubahan menyentuh endpoint, baca juga `docs/api-reference.md`.
- Jika perubahan menyentuh alur UI/UX, baca juga `docs/ui-walkthrough.md`.
- Jika perubahan menyentuh fitur spesifik, baca juga `docs/03-features/<module>.md` yang relevan.
- Jika perubahan menyentuh pola reusable/guide modul, baca juga file di `docs/guide/*` yang terkait.

## 3) Non-Negotiable Standards

1. Tenant route guard
- Route tenant wajib mempertahankan guard yang sesuai dengan arsitektur saat ini:
  - `tenant.resolve` / resolver tenant yang aktif di route terkait
  - `tenant.access`
  - `permission.team`
  - `tenant.feature` bila surface tersebut memakai entitlement fitur

2. RBAC naming
- Permission wajib konsisten dengan format `module.action`.
- Hindari naming baru yang tidak mengikuti matrix permission repo.

3. Subscription policy
- Semua logic plan, feature access, dan limit wajib melalui `SubscriptionEntitlements`.
- Pengecekan kuota boleh dilakukan di controller bila butuh custom response JSON yang jelas.
- Dilarang hardcode limit plan di controller/service/policy.

4. i18n policy
- Dilarang menambah user-facing copy hardcoded pada area yang sudah translated.
- Gunakan translation key yang konsisten dan update locale yang relevan.

5. Docs and progress policy
- Perubahan code yang mengubah perilaku publik tidak boleh selesai tanpa evaluasi dampak ke docs.
- Perubahan modul tidak boleh selesai tanpa evaluasi apakah progress module perlu diperbarui.

## 4) Docs Update Contract (Strict)

Jika perubahan menyentuh fitur/modul:

1. Wajib update dokumen fitur terkait di `docs/03-features/*` bila perilaku, flow, batasan, atau kontrak modul berubah.
2. Wajib update `docs/api-reference.md` jika endpoint, middleware, payload, query param, atau response contract berubah.
3. Wajib update `docs/testing-quality.md` jika test matrix, quality gate, atau skenario verifikasi berubah.
4. Wajib update `docs/ui-walkthrough.md` atau referensi screenshot bila flow UI berubah secara material.

PR tidak dianggap selesai bila kontrak di atas diabaikan tanpa alasan eksplisit.

## 5) Progress Update Contract (Strict)

Jika PR menyentuh sebuah modul:

1. Wajib review `docs/08-progress/modules/<module>.md`.
2. Wajib update file modul tersebut jika ada perubahan progress nyata, milestone, blocker, atau next actions.
3. Wajib update `docs/08-progress/index.md` jika status/progress high-level lintas modul ikut berubah.
4. Timestamp wajib format `YYYY-MM-DD`.
5. Bagian `Next Actions` maksimal 3 item aktif.

## 6) PR Completion Checklist for Agents

Sebelum menutup pekerjaan, agent wajib melaporkan status:

- Code change done
- Test/verification done
- Docs changed
- Progress changed

Jika ada item tidak dilakukan, agent wajib menulis alasan eksplisit dan risikonya.

## 7) Output Style for Agent Reports

- Ringkas, langsung ke perubahan inti.
- Wajib menyertakan bukti file yang disentuh.
- Wajib menyebut file docs/progress yang diperbarui, atau menyebut eksplisit jika tidak ada perubahan docs/progress beserta alasannya.
- Jika ada deviation dari standar ini, jelaskan alasan secara eksplisit.
