<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFinanceTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by Policy in controller
    }

    public function rules(): array
    {
        $tenantId = $this->route('tenant') instanceof \App\Models\Tenant
            ? $this->route('tenant')->id
            : $this->route('tenant');

        return [
            'row_version'        => ['required', 'integer', 'min:1'],
            'type'               => ['required', 'in:pemasukan,pengeluaran'],
            'transaction_date'   => ['required', 'date', 'before_or_equal:today'],
            'amount'             => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'currency_code'      => ['required', 'exists:master_currencies,code'],
            'exchange_rate'      => ['required', 'numeric', 'min:0.000001'],
            'category_id'        => [
                'required',
                'string',
                \Illuminate\Validation\Rule::exists('shared_categories', 'id')
                    ->where('tenant_id', $tenantId)
                    ->where('module', 'finance'),
            ],
            'description'        => ['required', 'string', 'max:255'],
            'payment_method'     => ['required', 'in:tunai,transfer,kartu_kredit,kartu_debit,dompet_digital,qris,lainnya'],
            'notes'              => ['nullable', 'string', 'max:2000'],
            'reference_number'   => ['nullable', 'string', 'max:100'],
            'merchant_name'      => ['nullable', 'string', 'max:150'],
            'location'           => ['nullable', 'string', 'max:200'],
            'tags'               => ['nullable', 'array', 'max:10'],
            'tags.*'             => ['string', 'max:50'],
            'is_recurring'       => ['nullable', 'boolean'],
            'recurring_freq'     => ['required_if:is_recurring,true', 'nullable', 'in:harian,mingguan,bulanan,tahunan'],
            'recurring_end_date' => ['nullable', 'date', 'after:transaction_date'],
        ];
    }
}
