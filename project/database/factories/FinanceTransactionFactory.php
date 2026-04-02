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
            'type'             => $this->faker->randomElement(['pemasukan', 'pengeluaran']),
            'transaction_date' => now(),
            'amount'           => $this->faker->randomFloat(2, 1000, 100000),
            'currency_id'      => 1, // Assumes currency id=1 (IDR) exists from test setUp
            'exchange_rate'    => 1.0,
            'base_currency_code' => 'IDR',
            'description'      => $this->faker->sentence(),
            'payment_method'   => $this->faker->randomElement(['tunai', 'transfer', 'kartu_kredit']),
            'row_version'      => 1,
        ];
    }
}
