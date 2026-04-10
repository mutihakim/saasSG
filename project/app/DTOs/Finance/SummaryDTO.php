<?php

namespace App\DTOs\Finance;

readonly class SummaryDTO
{
    public function __construct(
        public float $income,
        public float $spending,
        public float $monthlySaving,
        public float $totalAssets,
        public float $cashBankAssets,
        public float $totalLiabilities,
        public float $lockedFunds,
        public float $freeFunds,
        public float $liquidityRatio,
        public float $savingRate,
        public float $debtRatio,
        public array $assetAllocation,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            income: (float) ($data['income'] ?? 0.0),
            spending: (float) ($data['spending'] ?? 0.0),
            monthlySaving: (float) ($data['monthlySaving'] ?? 0.0),
            totalAssets: (float) ($data['totalAssets'] ?? 0.0),
            cashBankAssets: (float) ($data['cashBankAssets'] ?? 0.0),
            totalLiabilities: (float) ($data['totalLiabilities'] ?? 0.0),
            lockedFunds: (float) ($data['lockedFunds'] ?? 0.0),
            freeFunds: (float) ($data['freeFunds'] ?? 0.0),
            liquidityRatio: (float) ($data['liquidityRatio'] ?? 0.0),
            savingRate: (float) ($data['savingRate'] ?? 0.0),
            debtRatio: (float) ($data['debtRatio'] ?? 0.0),
            assetAllocation: (array) ($data['assetAllocation'] ?? []),
        );
    }

    public function toArray(): array
    {
        return [
            'income' => $this->income,
            'spending' => $this->spending,
            'monthly_saving' => $this->monthlySaving,
            'total_assets' => $this->totalAssets,
            'cash_bank_assets' => $this->cashBankAssets,
            'total_liabilities' => $this->totalLiabilities,
            'locked_funds' => $this->lockedFunds,
            'free_funds' => $this->freeFunds,
            'liquidity_ratio' => $this->liquidityRatio,
            'saving_rate' => $this->savingRate,
            'debt_ratio' => $this->debtRatio,
            'asset_allocation' => $this->assetAllocation,
        ];
    }
}
