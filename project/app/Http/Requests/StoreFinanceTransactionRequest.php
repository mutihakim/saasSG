<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFinanceTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by Policy in controller
    }

    public function rules(): array
    {
        $tenantId = $this->route('tenant') instanceof \App\Models\Tenant\Tenant
            ? $this->route('tenant')->id
            : $this->route('tenant');

        return [
            'type'               => ['required', 'in:pemasukan,pengeluaran,transfer'],
            'transaction_date'   => ['required', 'date', 'before_or_equal:tomorrow'],
            'amount'             => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'currency_code'      => [
                'required',
                \Illuminate\Validation\Rule::exists('tenant_currencies', 'code')
                    ->where('tenant_id', $tenantId)
                    ->where('is_active', true),
            ],
            'exchange_rate'      => ['nullable', 'numeric', 'min:0.000001'],
            'category_id'        => [
                \Illuminate\Validation\Rule::requiredIf(fn () => $this->input('type') !== 'transfer'),
                'nullable',
                'integer',
                \Illuminate\Validation\Rule::exists('tenant_categories', 'id')
                    ->where('tenant_id', $tenantId)
                    ->where('module', 'finance'),
            ],
            'description'        => ['required', 'string', 'max:255'],
            'payment_method'     => ['nullable', 'in:tunai,transfer,kartu_kredit,kartu_debit,dompet_digital,qris,lainnya'],
            'notes'              => ['nullable', 'string', 'max:2000'],
            'reference_number'   => ['nullable', 'string', 'max:100'],
            'merchant_name'      => ['nullable', 'string', 'max:150'],
            'location'           => ['nullable', 'string', 'max:200'],
            'source_type'        => ['nullable', 'string', 'max:100', 'required_with:source_id'],
            'source_id'          => ['nullable', 'string', 'max:100', 'required_with:source_type'],
            'owner_member_id'    => ['nullable', 'integer', \Illuminate\Validation\Rule::exists('tenant_members', 'id')->where('tenant_id', $tenantId)],
            'recipient_member_id'=> ['nullable', 'integer', \Illuminate\Validation\Rule::exists('tenant_members', 'id')->where('tenant_id', $tenantId)],
            'transfer_mode'      => ['nullable', 'in:wallet,member,account'],
            'from_account_id'    => ['nullable', 'string', 'size:26', \Illuminate\Validation\Rule::requiredIf(fn () => $this->input('type') === 'transfer' && ! $this->filled('from_wallet_id'))],
            'to_account_id'      => ['nullable', 'string', 'size:26', 'different:from_account_id', \Illuminate\Validation\Rule::requiredIf(fn () => $this->input('type') === 'transfer' && ! $this->filled('to_wallet_id'))],
            'from_wallet_id'     => ['nullable', 'string', 'size:26', \Illuminate\Validation\Rule::requiredIf(fn () => $this->input('type') === 'transfer' && ! $this->filled('from_account_id')), \Illuminate\Validation\Rule::exists('finance_wallets', 'id')->where('tenant_id', $tenantId)],
            'to_wallet_id'       => ['nullable', 'string', 'size:26', 'different:from_wallet_id', \Illuminate\Validation\Rule::requiredIf(fn () => $this->input('type') === 'transfer' && ! $this->filled('to_account_id')), \Illuminate\Validation\Rule::exists('finance_wallets', 'id')->where('tenant_id', $tenantId)],
            'budget_id'          => ['nullable', 'string', 'size:26', \Illuminate\Validation\Rule::exists('tenant_budgets', 'id')->where('tenant_id', $tenantId)],
            'bank_account_id'    => ['nullable', 'string', 'size:26', \Illuminate\Validation\Rule::exists('tenant_bank_accounts', 'id')->where('tenant_id', $tenantId)],
            'wallet_id'          => ['nullable', 'string', 'size:26', \Illuminate\Validation\Rule::exists('finance_wallets', 'id')->where('tenant_id', $tenantId)],
            'is_internal_transfer' => ['nullable', 'boolean'],
            'transfer_pair_id'   => ['nullable', 'string', 'size:26'],
            'tags'               => ['nullable', 'array', 'max:10'],
            'tags.*'             => ['string', 'max:50'],
            'is_recurring'       => ['nullable', 'boolean'],
            'recurring_freq'     => ['required_if:is_recurring,true', 'nullable', 'in:harian,mingguan,bulanan,tahunan'],
            'recurring_end_date' => ['nullable', 'date', 'after:transaction_date'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.required'             => 'Tipe transaksi wajib dipilih.',
            'amount.required'           => 'Jumlah wajib diisi.',
            'amount.min'                => 'Jumlah harus lebih dari 0.',
            'currency_code.exists'      => 'Mata uang tidak valid.',
            'exchange_rate.min'         => 'Kurs harus lebih dari 0.',
            'category_id.required'      => 'Kategori wajib dipilih.',
            'category_id.exists'        => 'Kategori tidak ditemukan.',
            'description.required'      => 'Deskripsi wajib diisi.',
            'description.max'           => 'Deskripsi maksimal 255 karakter.',
            'recurring_freq.required_if' => 'Frekuensi pengulangan wajib dipilih.',
        ];
    }
}
