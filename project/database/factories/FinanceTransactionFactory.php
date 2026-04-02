<?php

namespace Database\Factories;

use App\Models\FinanceTransaction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\FinanceTransaction>
 */
class FinanceTransactionFactory extends Factory
{
    protected $model = FinanceTransaction::class;

    public function definition(): array
    {
        return [
            'type' => $this->faker->randomElement(['pemasukan', 'pengeluaran']),
            'transaction_date' => now(),
            'amount' => $this->faker->randomFloat(2, 1000, 100000),
            'currency_code' => 'IDR',
            'description' => $this->faker->sentence(),
            'payment_method' => $this->faker->randomElement(['tunai', 'transfer', 'kartu_kredit']),
            'status' => 'terverifikasi',
            'row_version' => 1,
        ];
    }
}
