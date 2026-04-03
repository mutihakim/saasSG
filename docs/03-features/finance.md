# 03 Features - Finance Module

## 1) Tujuan dan Ruang Lingkup

Finance module adalah sistem pencatatan transaksi keuangan multi-currency dengan dukungan untuk:
- pencatatan transaksi pemasukan/pengeluaran/transfer
- kategorisasi transaksi per modul (finance, grocery, inventory, dll)
- tagging untuk labeling dan filtering
- payment method tracking (Tunai, Transfer, Kartu Kredit/Debit, E-Wallet, QRIS)
- multi-currency dengan konversi ke base currency
- summary dashboard dengan top expense categories

Tujuan utamanya:
- memberikan pencatatan keuangan yang akurat dan teraudit
- mendukung workflow keluarga/organisasi dalam mengelola keuangan
- menyediakan data untuk laporan dan analisis

## 2) Arsitektur dan Komponen

### Backend Components

| Component | File | Purpose |
|---|---|---|
| Model | `app/Models/FinanceTransaction.php` | Transaction entity dengan polymorphic relations |
| Controller | `app/Http/Controllers/Api/MasterCategoryApiController.php` | Category CRUD API |
| Controller | `app/Http/Controllers/Api/MasterTagApiController.php` | Tag CRUD API |
| Service | `app/Services/FinanceSummaryService.php` | Summary calculation & caching |
| Migration | `database/migrations/*_finance_transactions.php` | Schema definition |
| Migration | `database/migrations/2026_04_02_230825_add_is_active_to_tenant_tags.php` | Tag is_active field |
| Migration | `database/migrations/2026_04_02_233000_fix_tenant_taggables_polymorphic_id.php` | Polymorphic ID fix |

### Frontend Components

| Component | File | Purpose |
|---|---|---|
| Page | `resources/js/Pages/Tenant/Finance/Index.tsx` | Main finance dashboard |
| Component | `resources/js/Pages/Tenant/Finance/components/FinanceCol.tsx` | Finance column components |
| Component | `resources/js/Pages/Tenant/Finance/components/TransactionModal.tsx` | Transaction CRUD modal |
| Component | `resources/js/Components/Finance/TagsInput.tsx` | Tags input component |
| Locale | `resources/js/locales/{en,id}/tenant/finance.json` | Finance translations |

## 3) Database Schema

### Finance Transactions

```sql
CREATE TABLE finance_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    category_id BIGINT,
    currency_id BIGINT,
    created_by BIGINT,
    type ENUM('pemasukan', 'pengeluaran', 'transfer') NOT NULL,
    transaction_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    exchange_rate DECIMAL(12, 6) DEFAULT 1.000000,
    base_currency_code VARCHAR(10) DEFAULT 'IDR',
    amount_base DECIMAL(12, 2),
    notes TEXT,
    payment_method ENUM('tunai', 'transfer', 'kartu_kredit', 'kartu_debit', 'dompet_digital', 'qris', 'lainnya'),
    reference_number VARCHAR(100),
    merchant_name VARCHAR(255),
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    row_version INTEGER DEFAULT 1,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Indexes
    INDEX idx_tenant_date (tenant_id, transaction_date),
    INDEX idx_type (type),
    INDEX idx_category (category_id),
    INDEX idx_payment_method (payment_method)
);
```

### Polymorphic Relations (Tags)

```sql
CREATE TABLE tenant_tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#677abd',
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,  -- ← Added 2026-04-03
    row_version INTEGER DEFAULT 1,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_tenant_active (tenant_id, is_active)
);

CREATE TABLE tenant_taggables (
    tenant_tag_id BIGINT NOT NULL,
    taggable_type VARCHAR(100) NOT NULL,
    taggable_id VARCHAR(100) NOT NULL,  -- ← STRING untuk polymorphic compatibility
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (tenant_tag_id, taggable_type, taggable_id),
    INDEX idx_taggable (taggable_type, taggable_id),
    FOREIGN KEY (tenant_tag_id) REFERENCES tenant_tags(id) ON DELETE CASCADE
);
```

> [!IMPORTANT]
> **Polymorphic ID Type:** `taggable_id` menggunakan `string(100)` bukan `ulid()` atau `bigInteger()` untuk mendukung berbagai tipe primary key dari model yang berbeda (BIGINT, ULID, UUID).

## 4) Enum Definitions

### Transaction Type

```php
enum TransactionType: string
{
    case PEMASUKAN = 'pemasukan';
    case PENGELUARAN = 'pengeluaran';
    case TRANSFER = 'transfer';
}
```

### Payment Method

```php
enum PaymentMethod: string
{
    case TUNAI = 'tunai';
    case TRANSFER = 'transfer';
    case KARTU_KREDIT = 'kartu_kredit';
    case KARTU_DEBIT = 'kartu_debit';
    case DOMPET_DIGITAL = 'dompet_digital';
    case QRIS = 'qris';
    case LAINNYA = 'lainnya';
}
```

## 5) API Endpoints

### Transactions

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/api/transactions` | `finance.view` | List transactions dengan filter |
| POST | `/api/transactions` | `finance.create` | Create transaction |
| PATCH | `/api/transactions/{id}` | `finance.update` | Update transaction |
| DELETE | `/api/transactions/{id}` | `finance.delete` | Soft delete transaction |

### Categories

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/api/categories` | `master.categories.view` | List categories per module |
| POST | `/api/categories` | `master.categories.create` | Create category |
| PATCH | `/api/categories/{id}` | `master.categories.update` | Update category |
| DELETE | `/api/categories/{id}` | `master.categories.delete` | Soft delete category |

### Tags

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/api/tags` | `master.tags.view` | List tags (dengan filter is_active) |
| POST | `/api/tags` | `master.tags.create` | Create tag |
| PATCH | `/api/tags/{id}` | `master.tags.update` | Update tag |
| DELETE | `/api/tags/{id}` | `master.tags.delete` | Soft delete tag |

## 6) Frontend-Backend Communication

### Request Pattern

```tsx
// Create transaction dengan tags
const response = await axios.post(`/api/tenants/${tenant.id}/transactions`, {
  type: 'pengeluaran',
  amount: 150000,
  transaction_date: '2026-04-03',
  category_id: 5,
  payment_method: 'dompet_digital',
  description: 'Belanja bulanan',
  tags: [1, 3, 7],  // Array of tag IDs
  row_version: 1
});
```

### Response Pattern

```json
{
  "ok": true,
  "data": {
    "id": 123,
    "type": "pengeluaran",
    "amount": "150000.00",
    "amount_base": "150000.00",
    "payment_method": "dompet_digital",
    "category": { "id": 5, "name": "Belanja", "icon": "ri-shopping-cart-line", "color": "#4CAF50" },
    "tags": [
      { "id": 1, "name": "Penting", "color": "#FF5722", "is_active": true },
      { "id": 3, "name": "Bulanan", "color": "#2196F3", "is_active": true }
    ],
    "row_version": 1,
    "transaction_date": "2026-04-03",
    "created_at": "2026-04-03T10:00:00Z"
  }
}
```

### Optimistic Concurrency Control

```tsx
// Frontend menyimpan row_version
const [formData, setFormData] = useState({
  amount: 0,
  row_version: 1
});

// Saat update, kirim row_version
await axios.patch(`/api/transactions/${id}`, {
  ...formData,
  row_version: currentTransaction.row_version
});

// Handle version conflict (409)
if (response.status === 409 && response.data.error_code === 'VERSION_CONFLICT') {
  notify.error({
    title: 'Conflict',
    detail: 'Data diubah oleh pengguna lain. Silakan muat ulang.'
  });
  // Reload data
}
```

## 7) Finance Summary Service

Service ini menghitung summary keuangan untuk dashboard dengan caching:

```php
// Usage
$summary = app(FinanceSummaryService::class)->getSummary($tenant, '2026-04');

// Response
[
    'period' => '2026-04',
    'base_currency' => 'IDR',
    'total_income_base' => 5000000.00,
    'total_expense_base' => 3500000.00,
    'balance_base' => 1500000.00,
    'transaction_count' => 25,
    'has_multi_currency' => false,
    'top_expense_categories' => [
        ['id' => 5, 'name' => 'Belanja', 'icon' => 'ri-shopping-cart-line', 'color' => '#4CAF50', 'amount' => 1500000, 'pct' => 42.9],
        // ... top 5
    ]
]
```

**Cache Invalidation:**
```php
// Setelah transaction CRUD
app(FinanceSummaryService::class)->invalidate($tenantId, '2026-04');
```

## 8) i18n Keys

### Finance Module

```json
{
  "finance.transactions.table.payment_method": "Payment Method",
  "finance.transactions.types.pemasukan": "Income",
  "finance.transactions.types.pengeluaran": "Expense",
  "finance.transactions.payment_methods.tunai": "Cash",
  "finance.transactions.payment_methods.dompet_digital": "E-Wallet",
  "finance.modals.transaction.fields.payment_method": "Payment Method",
  "finance.modals.transaction.fields.tags": "Tags",
  "finance.notifications.transaction_save_failed": "Failed to save transaction"
}
```

### Master Data - Categories

```json
{
  "master.categories.modules.finance": "Finance",
  "master.categories.modules.grocery": "Grocery",
  "master.categories.modules.inventory": "Inventory",
  "master.categories.types.income": "Income",
  "master.categories.types.expense": "Expense",
  "master.categories.placeholders.select_module": "Select module..."
}
```

### Master Data - Tags

```json
{
  "master.tags.status.active": "Active",
  "master.tags.status.inactive": "Inactive",
  "master.tags.fields.is_active": "Active"
}
```

## 9) Access Rules dan Permission

Permission contract untuk finance module:

| Permission | Description |
|---|---|
| `finance.view` | View transactions dan dashboard |
| `finance.create` | Create transaction baru |
| `finance.update` | Update transaction existing |
| `finance.delete` | Soft delete transaction |

Master Data permissions:

| Permission | Description |
|---|---|
| `master.categories.view` | View categories |
| `master.categories.create` | Create category |
| `master.categories.update` | Update category |
| `master.categories.delete` | Delete category |
| `master.tags.view` | View tags |
| `master.tags.create` | Create tag |
| `master.tags.update` | Update tag |
| `master.tags.delete` | Delete tag |

## 10) Error Handling

### Common Error Codes

| Error Code | HTTP Status | Description |
|---|---|---|
| `VERSION_CONFLICT` | 409 | Optimistic concurrency conflict |
| `MISSING_FIELDS` | 422 | Required fields not filled |
| `CATEGORY_NOT_FOUND` | 404 | Category ID tidak valid |
| `TAG_INACTIVE` | 400 | Tag yang digunakan sudah nonaktif |

### Frontend Error Handling

```tsx
import { parseApiError } from '../../../../common/apiError';
import { notify } from '../../../../common/notify';

try {
  await saveTransaction();
  notify.success(t('finance.messages.success_save'));
} catch (err: any) {
  const parsed = parseApiError(err, t('finance.notifications.transaction_save_failed'));
  notify.error({ title: parsed.title, detail: parsed.detail });
}
```

## 11) Best Practices

### Do:
- Selalu gunakan `amount_base` untuk perhitungan dan agregasi (base currency)
- Increment `row_version` setiap update untuk optimistic concurrency control
- Gunakan `is_active` pada tags untuk soft-deactivation daripada hard delete
- Invalidate cache summary setelah setiap transaction mutation
- Gunakan polymorphic relations dengan `string(100)` untuk kolom ID
- Documentasikan `$keyType = 'string'` workaround di model BIGINT legacy

### Don't:
- Jangan gunakan `amount` untuk agregasi jika ada multi-currency
- Jangan skip `row_version` validation di update endpoint
- Jangan hard delete tags yang masih digunakan (gunakan `is_active = false`)
- Jangan gunakan `ulid()` atau `bigInteger()` untuk kolom polymorphic pivot
- Jangan lupa sync `row_version` dari data yang diedit ke frontend state

## 12) Migration Notes

### Polymorphic ID Fix (2026-04-03)

Migration ini memperbaiki type mismatch di polymorphic relations:

```php
// BEFORE (salah)
$table->ulid('taggable_id');  // Tidak kompatibel dengan BIGINT models

// AFTER (benar)
$table->string('taggable_id', 100);  // Kompatibel dengan semua tipe PK
```

**FinanceTransaction Workaround:**
```php
class FinanceTransaction extends Model
{
    // Workaround untuk kompatibilitas dengan polymorphic string ID
    protected $keyType = 'string';
    public $incrementing = true;  // Tetap auto-increment
}
```

> [!WARNING]
> Workaround `$keyType = 'string'` hanya untuk model BIGINT legacy. Model baru harus menggunakan `HasUlids` trait.

### Tags is_active Field (2026-04-03)

Migration untuk menambahkan status aktif/nonaktif:

```php
Schema::table('tenant_tags', function (Blueprint $table) {
    $table->boolean('is_active')->default(true)->after('usage_count');
    $table->index(['tenant_id', 'is_active']);
});
```

**Usage:**
```php
// Query hanya tags aktif
$tags = TenantTag::forTenant($tenantId)->active()->get();

// Toggle is_active
$tag->update(['is_active' => !$tag->is_active]);
```

## 13) Screenshot Checklist

Minimum screenshot untuk finance module:

1. `finance-dashboard-happy.png` - Dashboard dengan summary
2. `finance-transaction-create.png` - Modal create transaction
3. `finance-transaction-with-tags.png` - Transaction dengan tags
4. `finance-payment-methods.png` - Payment method selection
5. `finance-categories-module.png` - Categories dengan module filter
6. `finance-tags-management.png` - Tags dengan is_active toggle

Folder target:
- `docs/assets/screenshots/finance`

## 14) Test Coverage Terkait

- `tests/Feature/FinanceTransactionTest.php`
- `tests/Feature/FinanceSummaryServiceTest.php`
- `tests/Feature/MasterCategoryTest.php`
- `tests/Feature/MasterTagTest.php`
- `tests/Feature/PolymorphicRelationsTest.php`
- `tests/e2e/finance-crud.spec.ts`
