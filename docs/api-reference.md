# 04 - API Reference

## Base

- Public: `/api/v1/...`
- Tenant protected: `/api/v1/tenants/{tenant}/...`
- Auth: `auth:sanctum`

## Middleware Contract

Tenant API route group menggunakan:

1. `auth:sanctum`
2. `tenant.initialize`
3. `tenant.access`
4. `permission.team`
5. `tenant.feature:<module>,<action>` (per endpoint)

Mutation endpoint umumnya memakai:

- `superadmin.impersonation`
- `throttle:tenant.mutation`

## Endpoint Groups

### Lifecycle

- `POST /api/v1/tenants`
- `POST /api/v1/invitations/accept`
- `POST /api/v1/tenants/{tenant}/suspend`
- `POST /api/v1/tenants/{tenant}/restore`

### Members

- `GET /api/v1/tenants/{tenant}/members`
- `POST /api/v1/tenants/{tenant}/members`
- `PATCH /api/v1/tenants/{tenant}/members/{member}`
- `DELETE /api/v1/tenants/{tenant}/members/{member}`
- `PATCH /api/v1/tenants/{tenant}/members/{member}/profile`
- `PATCH /api/v1/tenants/{tenant}/members/{member}/whatsapp-jid`

### Roles

- `GET /api/v1/tenants/{tenant}/roles`
- `POST /api/v1/tenants/{tenant}/roles`
- `PATCH /api/v1/tenants/{tenant}/roles/{role}`
- `PATCH /api/v1/tenants/{tenant}/roles/{role}/permissions`
- `DELETE /api/v1/tenants/{tenant}/roles/{role}`

### Invitations

- `GET /api/v1/tenants/{tenant}/invitations`
- `POST /api/v1/tenants/{tenant}/invitations`
- `POST /api/v1/tenants/{tenant}/invitations/{invitation}/revoke`
- `DELETE /api/v1/tenants/{tenant}/invitations/{invitation}`
- `POST /api/v1/tenants/{tenant}/invitations/{invitation}/resend`

### WhatsApp

- `GET /api/v1/tenants/{tenant}/whatsapp/session`
- `POST /api/v1/tenants/{tenant}/whatsapp/session/connect`
- `POST /api/v1/tenants/{tenant}/whatsapp/session/disconnect`
- `GET /api/v1/tenants/{tenant}/whatsapp/chats`
- `GET /api/v1/tenants/{tenant}/whatsapp/chats/{jid}/messages`
- `POST /api/v1/tenants/{tenant}/whatsapp/chats/{jid}/send`
- `POST /api/v1/tenants/{tenant}/whatsapp/chats/{jid}/read`

Internal callback behavior note:

- `POST /internal/v1/whatsapp/messages` (internal token protected) dapat memicu auto outgoing reply jika incoming text diawali `/` atau `!` dan command valid (`ping`, `help`).
- Jika command tidak dikenali, sistem mengirim fallback help message.
- `POST /internal/v1/whatsapp/session-state` menerapkan guard global `connected_jid`: jika nomor sudah aktif di tenant lain, tenant callback yang baru akan dipaksa `disconnected` dengan metadata conflict (`jid_conflict`) dan endpoint tetap merespons `200`.
- Pada path conflict tersebut, backend akan mencoba `remove session` ke service untuk tenant newcomer secara _best effort_; kegagalan service hanya dicatat di log dan tidak mengubah respons callback (`200`).

Query contract for `GET /whatsapp/chats/{jid}/messages`:

- `limit` (optional, default `15`, max `50`)
- `before_id` (optional cursor id untuk mengambil pesan yang lebih lama)

Response contract for `GET /whatsapp/chats/{jid}/messages`:

- `data.messages[]` (ascending by id, oldest -> newest di batch yang diminta)
- `data.has_more` (`true` jika masih ada pesan lebih lama)
- `data.next_before_id` (`id` pesan paling tua di batch saat ini; kirim ke request berikutnya sebagai `before_id`)

JID accepted:

- `digits@c.us`
- `digits@g.us`
- `digits@lid.us`
- plain number input will be normalized to `digits@c.us`

## Error Contract (Yang Sering Muncul)

| Code | Status | Keterangan |
|---|---|---|
| `FEATURE_NOT_AVAILABLE` | 403 | Plan tidak mengizinkan module/action |
| `PLAN_QUOTA_EXCEEDED` | 422 | Limit quota plan terlewati |
| `VALIDATION_ERROR` | 422 | Field tidak valid (ikut locale aktif) |
| `VERSION_CONFLICT` | 409 | Row version mismatch (OCC) |
| `IMMUTABLE_SYSTEM_ROLE` | 422 | Edit/hapus role sistem dilarang |
| `IDEMPOTENCY_KEY_REUSED` | 409 | Idempotency key dipakai ulang dengan payload berbeda |

### Master Data

Semua endpoint master data ada di bawah `/api/v1/tenants/{tenant}/master/`

**UOM (Unit of Measure):**
- `GET /master/uom` — `tenant.feature:master.uom,view`
- `POST /master/uom` — `tenant.feature:master.uom,create`
- `PATCH /master/uom/{uom}` — `tenant.feature:master.uom,update`
- `DELETE /master/uom/{uom}` — `tenant.feature:master.uom,delete`

**Currencies:**
- `GET /master/currencies` — `tenant.feature:master.currencies,view`
- `POST /master/currencies` — `tenant.feature:master.currencies,create`
- `PATCH /master/currencies/{currency}` — `tenant.feature:master.currencies,update`
- `DELETE /master/currencies/{currency}` — `tenant.feature:master.currencies,delete`

**Tags:**
- `GET /master/tags` — `tenant.feature:master.tags,view`
- `GET /master/tags/suggest` — `tenant.feature:master.tags,view`
- `POST /master/tags` — `tenant.feature:master.tags,create`
- `PATCH /master/tags/{tag}` — `tenant.feature:master.tags,update`
- `DELETE /master/tags/{tag}` — `tenant.feature:master.tags,delete`

**Categories:**
- `GET /master/categories` — `tenant.feature:master.categories,view`
- `POST /master/categories` — `tenant.feature:master.categories,create`
- `PATCH /master/categories/{category}` — `tenant.feature:master.categories,update`
- `PATCH /master/categories/bulk-parent` — `tenant.feature:master.categories,update`
- `DELETE /master/categories/{category}` — `tenant.feature:master.categories,delete`
- `DELETE /master/categories` (bulk) — `tenant.feature:master.categories,delete`

### Finance

- `GET /api/v1/tenants/{tenant}/finance/transactions`
- `POST /api/v1/tenants/{tenant}/finance/transactions`
- `PATCH /api/v1/tenants/{tenant}/finance/transactions/{transaction}`
- `DELETE /api/v1/tenants/{tenant}/finance/transactions/{transaction}`
- `POST /api/v1/tenants/{tenant}/finance/transactions/{transaction}/attachments`
- `GET /api/v1/tenants/{tenant}/finance/transactions/{transaction}/attachments/{attachment}/preview`
- `DELETE /api/v1/tenants/{tenant}/finance/transactions/{transaction}/attachments/{attachment}`
- `GET /api/v1/tenants/{tenant}/finance/whatsapp-intents/{token}`
- `POST /api/v1/tenants/{tenant}/finance/whatsapp-intents/{token}/submitted`
- `GET /api/v1/tenants/{tenant}/finance/whatsapp-media/{media}/preview`
- `GET /api/v1/tenants/{tenant}/wallet/accounts`
- `POST /api/v1/tenants/{tenant}/wallet/accounts`
- `PATCH /api/v1/tenants/{tenant}/wallet/accounts/{account}`
- `DELETE /api/v1/tenants/{tenant}/wallet/accounts/{account}`
- `GET /api/v1/tenants/{tenant}/wallet/wallets`
- `POST /api/v1/tenants/{tenant}/wallet/wallets`
- `PATCH /api/v1/tenants/{tenant}/wallet/wallets/{wallet}`
- `DELETE /api/v1/tenants/{tenant}/wallet/wallets/{wallet}`
- `GET /api/v1/tenants/{tenant}/wallet/goals`
- `POST /api/v1/tenants/{tenant}/wallet/goals`
- `PATCH /api/v1/tenants/{tenant}/wallet/goals/{goal}`
- `DELETE /api/v1/tenants/{tenant}/wallet/goals/{goal}`
- `GET /api/v1/tenants/{tenant}/wallet/wishes`
- `POST /api/v1/tenants/{tenant}/wallet/wishes`
- `PATCH /api/v1/tenants/{tenant}/wallet/wishes/{wish}`
- `DELETE /api/v1/tenants/{tenant}/wallet/wishes/{wish}`
- `POST /api/v1/tenants/{tenant}/wallet/wishes/{wish}/approve`
- `POST /api/v1/tenants/{tenant}/wallet/wishes/{wish}/reject`
- `POST /api/v1/tenants/{tenant}/wallet/wishes/{wish}/convert`

Catatan:
- payload wallet minimal memuat `id`, `name`, `type`, `scope`, `reference_code`, `real_account_id`, `current_balance`, dan relation `real_account`.
- metadata target disimpan di `finance_savings_goals`, bukan di tabel wallet.
- `POST /finance/whatsapp-intents/{token}/submitted` menerima `linked_resource_type?`, `submitted_count?`, dan `transaction_ids[]`.
- Endpoint tersebut bersifat idempotent untuk draft yang sudah `submitted`.
- Attachment image upload akan dinormalisasi ke `image/webp` di backend bila file sumber berupa gambar.
- WhatsApp finance intent punya 2 mode ekstraksi:
  - natural language `/tx` dan `/bulk` wajib diproses AI provider yang aktif
  - structured command memakai format `deskripsi#jumlah` dan diparse tanpa AI
- Default AI provider saat ini adalah OpenRouter dengan model `qwen/qwen3.6-plus:free`.
- Jika ekstraksi AI gagal untuk natural language, backend tidak mengirim link review ke `/finance`; pengguna menerima pesan error di WhatsApp dan intent disimpan dengan status `failed`.
- Response draft WhatsApp finance sekarang dapat memuat `media_items[]` selain media utama tunggal, agar PWA bisa menampilkan banyak preview attachment.

### Games

Math Game endpoint berada di bawah `/api/v1/tenants/{tenant}/games/math`.

- `GET /games/math/config`
- `GET /games/math/mastered?operator=+`
- `POST /games/math/stats`
- `POST /games/math/attempt`
- `POST /games/math/session/finish`
- `GET /games/math/history?limit=10`

`POST /games/math/stats` menerima `pairs[]` berisi `operator`, `angka_pilihan`, dan `angka_random`, lalu mengembalikan `data.stats` dengan key `{operator}|{angka_pilihan}|{angka_random}`.
