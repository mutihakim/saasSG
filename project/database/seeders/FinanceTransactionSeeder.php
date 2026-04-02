<?php

namespace Database\Seeders;

use App\Models\FinanceTransaction;
use App\Models\SharedCategory;
use App\Models\SharedTag;
use App\Models\Tenant;
use App\Models\TenantMember;
use App\Enums\TransactionType;
use App\Enums\PaymentMethod;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Carbon\Carbon;

class FinanceTransactionSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            $this->seedTransactionsForTenant($tenant);
        }
    }

    private function seedTransactionsForTenant(Tenant $tenant): void
    {
        $categories = SharedCategory::forTenant($tenant->id)->forModule('finance')->get();
        $tags = SharedTag::forTenant($tenant->id)->get();
        $member = TenantMember::query()->where('tenant_id', $tenant->id)->first();

        if ($categories->isEmpty() || !$member) {
            return;
        }

        $incomeCategories = $categories->where('sub_type', 'pemasukan');
        $expenseCategories = $categories->where('sub_type', 'pengeluaran');

        if ($incomeCategories->isEmpty() || $expenseCategories->isEmpty()) {
            return;
        }

        // Create 20-30 transactions for the last 3 months
        for ($i = 0; $i < rand(20, 30); $i++) {
            $type = Arr::random([TransactionType::PEMASUKAN, TransactionType::PENGELUARAN]);
            $category = ($type === TransactionType::PEMASUKAN) 
                ? $incomeCategories->random() 
                : $expenseCategories->random();

            $date = Carbon::now()->subDays(rand(0, 90));
            $amount = ($type === TransactionType::PEMASUKAN) 
                ? rand(1000000, 10000000) 
                : rand(10000, 1000000);

            $transaction = FinanceTransaction::create([
                'tenant_id' => $tenant->id,
                'category_id' => $category->id,
                'currency_code' => 'IDR',
                'created_by' => $member->id,
                'type' => $type,
                'transaction_date' => $date,
                'amount' => $amount,
                'description' => $this->generateDescription($category->name, $type),
                'exchange_rate' => 1,
                'base_currency' => 'IDR',
                'payment_method' => Arr::random(PaymentMethod::cases()),
                'merchant_name' => ($type === TransactionType::PENGELUARAN) ? $this->generateMerchant() : null,
                'row_version' => 1,
            ]);

            // Attach 1-2 random tags
            if ($tags->isNotEmpty()) {
                $count = min($tags->count(), rand(1, 2));
                $transaction->tags()->syncWithoutDetaching($tags->random($count)->pluck('id'));
            }
        }
    }

    private function generateDescription(string $categoryName, TransactionType $type): string
    {
        $incomeDescs = [
            'Gaji bulan ini',
            'Bonus proyek freelance',
            'Hasil penjualan barang bekas',
            'Transfer dari tabungan',
            'Dividen investasi',
        ];

        $expenseDescs = [
            'Beli makan siang',
            'Belanja mingguan',
            'Bayar tagihan listrik',
            'Bensin motor/mobil',
            'Kopi sore',
            'Nonton bioskop',
            'Beli buku baru',
            'Iuran bulanan',
        ];

        if ($type === TransactionType::PEMASUKAN) {
            return Arr::random($incomeDescs) . " (" . $categoryName . ")";
        }

        return Arr::random($expenseDescs) . " (" . $categoryName . ")";
    }

    private function generateMerchant(): string
    {
        return Arr::random([
            'Indomaret',
            'Alfamart',
            'Pertamina',
            'Gofood / Grabfood',
            'Shopee',
            'Tokopedia',
            'Restoran Padang Sederhana',
            'Starbucks',
            'PLN',
            'PDAM',
        ]);
    }
}
