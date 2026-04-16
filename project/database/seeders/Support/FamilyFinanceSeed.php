<?php

namespace Database\Seeders\Support;

use App\Enums\PaymentMethod;
use App\Enums\TransactionType;
use InvalidArgumentException;

/**
 * Static demo data blueprints for finance sample tenants.
 *
 * IMPORTANT: This class is DEMO-ONLY. It is NOT the source of truth for
 * finance baseline accounts/wallets.
 *
 * Baseline infrastructure is now handled by:
 *   - App\Services\Tenant\Finance\TenantFinanceBaselineService
 *   - App\Services\Tenant\Finance\FinanceBaselineBlueprint
 *
 * Baseline accounts are created via TenantProvisionService hooks:
 *   - tenant bootstrap (TenantBaselineSeeder -> provision())
 *   - new tenant registration (provisionDefaultWorkspaceForUser())
 *   - linked member creation (TenantMemberApiController->store())
 *   - invitation accept (TenantLifecycleApiController->invitationsAccept())
 *   - role normalize/repair (NormalizeTenantMemberRoles command)
 *
 * This class provides:
 *   - accountBlueprints: historical account definitions for demo tenants
 *     (used by demo seeders to resolve account names for pockets/budgets/transactions)
 *   - pocketBlueprints: sample non-system wallet definitions per account
 *   - budgetBlueprints: sample budget amounts per tenant plan
 *   - planningBlueprints: sample goals/wishes (enterprise only)
 *   - demoTransactions: sample finance transactions per tenant plan
 *
 * Demo seeders live in: database/seeders/Tenant/Finance/Demo/
 */
class FamilyFinanceSeed
{
    /**
     * Historical account definitions for demo tenants.
     *
     * These names are used by demo wallet/budget/transaction seeders
     * to resolve accounts by name. When baseline accounts don't match
     * these names, demo data for those accounts is silently skipped.
     *
     * @return array<array{name:string,scope:string,type:string,owner:string,opening_balance:int}>
     */
    public static function accountBlueprints(string $tenantSlug): array
    {
        return match ($tenantSlug) {
            'free' => [
                ['name' => 'Bank Owner', 'scope' => 'private', 'type' => 'bank', 'owner' => 'owner', 'opening_balance' => 2500000],
                ['name' => 'Tunai Owner', 'scope' => 'private', 'type' => 'cash', 'owner' => 'owner', 'opening_balance' => 350000],
            ],
            'pro' => [
                ['name' => 'Bank Owner', 'scope' => 'private', 'type' => 'bank', 'owner' => 'owner', 'opening_balance' => 3500000],
                ['name' => 'Tunai Owner', 'scope' => 'private', 'type' => 'cash', 'owner' => 'owner', 'opening_balance' => 450000],
                ['name' => 'eWallet Owner', 'scope' => 'private', 'type' => 'ewallet', 'owner' => 'owner', 'opening_balance' => 180000],
            ],
            'business' => [
                ['name' => 'Bank Owner', 'scope' => 'private', 'type' => 'bank', 'owner' => 'owner', 'opening_balance' => 4500000],
                ['name' => 'Tunai Owner', 'scope' => 'private', 'type' => 'cash', 'owner' => 'owner', 'opening_balance' => 500000],
                ['name' => 'eWallet Owner', 'scope' => 'private', 'type' => 'ewallet', 'owner' => 'owner', 'opening_balance' => 250000],
                ['name' => 'Bank Bisnis', 'scope' => 'shared', 'type' => 'bank', 'owner' => 'owner', 'opening_balance' => 3200000],
            ],
            'enterprise' => [
                ['name' => 'Bank Abi', 'scope' => 'private', 'type' => 'bank', 'owner' => 'abi', 'opening_balance' => 3800000],
                ['name' => 'Tunai Abi', 'scope' => 'private', 'type' => 'cash', 'owner' => 'abi', 'opening_balance' => 450000],
                ['name' => 'Paylater Abi', 'scope' => 'private', 'type' => 'paylater', 'owner' => 'abi', 'opening_balance' => 0],
                ['name' => 'Kredit Abi', 'scope' => 'private', 'type' => 'credit_card', 'owner' => 'abi', 'opening_balance' => 0],
                ['name' => 'Bank Umma', 'scope' => 'private', 'type' => 'bank', 'owner' => 'umma', 'opening_balance' => 10000000],
                ['name' => 'Tunai Umma', 'scope' => 'private', 'type' => 'cash', 'owner' => 'umma', 'opening_balance' => 550000],
                ['name' => 'Paylater Umma', 'scope' => 'private', 'type' => 'paylater', 'owner' => 'umma', 'opening_balance' => 0],
                ['name' => 'Kredit Umma', 'scope' => 'private', 'type' => 'credit_card', 'owner' => 'umma', 'opening_balance' => 0],
                ['name' => 'Bank Anak', 'scope' => 'private', 'type' => 'bank', 'owner' => 'kakak', 'opening_balance' => 2500000],
                ['name' => 'Tunai Anak', 'scope' => 'private', 'type' => 'cash', 'owner' => 'kakak', 'opening_balance' => 175000],
                ['name' => 'eWallet Anak', 'scope' => 'private', 'type' => 'ewallet', 'owner' => 'kakak', 'opening_balance' => 90000],
                ['name' => 'Bank Bisnis', 'scope' => 'shared', 'type' => 'bank', 'owner' => 'owner', 'opening_balance' => 8400000],
                ['name' => 'Bank Darurat', 'scope' => 'shared', 'type' => 'bank', 'owner' => 'owner', 'opening_balance' => 4600000],
            ],
            default => [],
        };
    }

    public static function pocketBlueprints(string $tenantSlug): array
    {
        return match ($tenantSlug) {
            'free' => [],
            'pro' => [
                'Bank Owner' => [
                    ['name' => 'Transport & Maintenance', 'type' => 'personal', 'purpose_type' => 'spending'],
                    ['name' => 'Tagihan Tetap',            'type' => 'personal', 'purpose_type' => 'spending'],
                    ['name' => 'Belanja Dapur & RT',       'type' => 'personal', 'purpose_type' => 'spending'],
                ],
                'eWallet Owner' => [
                    ['name' => 'Makan Luar & Jajan', 'type' => 'personal', 'purpose_type' => 'spending'],
                ],
            ],
            'business' => [
                'Bank Owner' => [
                    ['name' => 'Transport & Maintenance', 'type' => 'personal', 'purpose_type' => 'spending'],
                    ['name' => 'Tagihan Tetap',            'type' => 'personal', 'purpose_type' => 'spending'],
                    ['name' => 'Belanja Dapur & RT',       'type' => 'personal', 'purpose_type' => 'spending'],
                ],
                'Bank Bisnis' => [
                    ['name' => 'Operasional Bisnis', 'type' => 'business', 'purpose_type' => 'spending'],
                    ['name' => 'Marketing Bisnis',   'type' => 'business', 'purpose_type' => 'spending'],
                ],
            ],
            'enterprise' => [
                'Bank Abi' => [
                    // income wallets — kotak masuk pendapatan
                    ['name' => 'Penerimaan Pendapatan', 'type' => 'personal', 'purpose_type' => 'income'],
                    ['name' => 'Penerimaan Lainnya',    'type' => 'personal', 'purpose_type' => 'income'],
                    // spending wallets
                    ['name' => 'Transport & Maintenance', 'type' => 'personal', 'purpose_type' => 'spending'],
                    ['name' => 'Tagihan Tetap',            'type' => 'personal', 'purpose_type' => 'spending'],
                    ['name' => 'Personal & Hobby',         'type' => 'personal', 'purpose_type' => 'spending'],
                    ['name' => 'Professional Growth',      'type' => 'personal', 'purpose_type' => 'spending'],
                    ['name' => 'Layanan Digital',          'type' => 'personal', 'purpose_type' => 'spending'],
                    ['name' => 'Peralatan & Gadget',       'type' => 'personal', 'purpose_type' => 'spending'],
                ],
                'Bank Umma' => [
                    ['name' => 'Belanja Dapur & RT', 'type' => 'personal', 'purpose_type' => 'spending'],
                    ['name' => 'Gaji ART & Staff',   'type' => 'personal', 'purpose_type' => 'spending'],
                    ['name' => 'Perawatan Diri',      'type' => 'personal', 'purpose_type' => 'spending'],
                    ['name' => 'Peralatan & Gadget',  'type' => 'personal', 'purpose_type' => 'spending'],
                    ['name' => 'Makan Luar & Jajan',  'type' => 'personal', 'purpose_type' => 'spending'],
                    ['name' => 'Sosial & Kado',       'type' => 'personal', 'purpose_type' => 'spending'],
                ],
                'Bank Anak' => [
                    ['name' => 'SPP & Sekolah Rutin',         'type' => 'personal', 'purpose_type' => 'spending'],
                    ['name' => 'Kebutuhan Balita',             'type' => 'personal', 'purpose_type' => 'spending'],
                    ['name' => 'Jajan & Mainan',               'type' => 'personal', 'purpose_type' => 'spending'],
                    // income wallet anak
                    ['name' => 'Penerimaan Hadiah',            'type' => 'personal', 'purpose_type' => 'income'],
                ],
                'Bank Bisnis' => [
                    // income wallet bisnis
                    ['name' => 'Penerimaan Pendapatan', 'type' => 'business', 'purpose_type' => 'income'],
                    // spending wallets bisnis
                    ['name' => 'Operasional Bisnis', 'type' => 'business', 'purpose_type' => 'spending'],
                    ['name' => 'Marketing Bisnis',   'type' => 'business', 'purpose_type' => 'spending'],
                    // saving wallet bisnis (budget_lock tetap, tapi purpose_type = saving)
                    ['name' => 'Laba Ditahan', 'type' => 'shared', 'purpose_type' => 'saving', 'budget_lock' => false],
                ],
                'Bank Darurat' => [
                    // spending wallets (pengeluaran darurat yang wajar dibudget)
                    ['name' => 'Kesehatan & Medis', 'type' => 'shared', 'purpose_type' => 'spending'],
                    ['name' => 'Perbaikan Rumah',   'type' => 'shared', 'purpose_type' => 'spending'],
                    // saving wallets — tidak perlu budget, hanya ditabung
                    ['name' => 'Dana Siaga',                  'type' => 'shared', 'purpose_type' => 'saving', 'budget_lock' => false],
                    ['name' => 'Dana Pendidikan Masa Depan',  'type' => 'shared', 'purpose_type' => 'saving', 'budget_lock' => false],
                    // income wallet dari investasi
                    ['name' => 'Penerimaan Investasi', 'type' => 'shared', 'purpose_type' => 'income'],
                    // utility wallet
                    ['name' => 'Transfer Internal', 'type' => 'shared', 'purpose_type' => 'spending'],
                ],
            ],
            default => [],
        };
    }

    public static function budgetBlueprints(string $tenantSlug): array
    {
        return match ($tenantSlug) {
            'free' => [
                ['name' => 'Belanja Dapur & RT', 'scope' => 'private', 'owner' => 'owner', 'amount' => 1500000, 'default_pockets' => [['account' => 'Bank Owner', 'pocket' => 'Utama']]],
                ['name' => 'Tagihan Tetap',       'scope' => 'private', 'owner' => 'owner', 'amount' => 900000,  'default_pockets' => [['account' => 'Bank Owner', 'pocket' => 'Utama']]],
            ],
            'pro' => [
                ['name' => 'Transport & Maintenance', 'scope' => 'private', 'owner' => 'owner', 'amount' => 900000,  'default_pockets' => [['account' => 'Bank Owner', 'pocket' => 'Transport & Maintenance']]],
                ['name' => 'Tagihan Tetap',            'scope' => 'private', 'owner' => 'owner', 'amount' => 1100000, 'default_pockets' => [['account' => 'Bank Owner', 'pocket' => 'Tagihan Tetap']]],
                ['name' => 'Belanja Dapur & RT',       'scope' => 'private', 'owner' => 'owner', 'amount' => 1800000, 'default_pockets' => [['account' => 'Bank Owner', 'pocket' => 'Belanja Dapur & RT']]],
                ['name' => 'Makan Luar & Jajan',       'scope' => 'private', 'owner' => 'owner', 'amount' => 450000,  'default_pockets' => [['account' => 'eWallet Owner', 'pocket' => 'Makan Luar & Jajan']]],
            ],
            'business' => [
                ['name' => 'Transport & Maintenance', 'scope' => 'private', 'owner' => 'owner', 'amount' => 1100000, 'default_pockets' => [['account' => 'Bank Owner', 'pocket' => 'Transport & Maintenance']]],
                ['name' => 'Tagihan Tetap',            'scope' => 'private', 'owner' => 'owner', 'amount' => 1200000, 'default_pockets' => [['account' => 'Bank Owner', 'pocket' => 'Tagihan Tetap']]],
                ['name' => 'Belanja Dapur & RT',       'scope' => 'private', 'owner' => 'owner', 'amount' => 2200000, 'default_pockets' => [['account' => 'Bank Owner', 'pocket' => 'Belanja Dapur & RT']]],
                ['name' => 'Operasional Bisnis',        'scope' => 'shared',  'owner' => 'owner', 'amount' => 2500000, 'default_pockets' => [['account' => 'Bank Bisnis', 'pocket' => 'Operasional Bisnis']]],
                ['name' => 'Marketing Bisnis',          'scope' => 'shared',  'owner' => 'owner', 'amount' => 1100000, 'default_pockets' => [['account' => 'Bank Bisnis', 'pocket' => 'Marketing Bisnis']]],
            ],
            'enterprise' => [
                // === Abi — spending wallets only ===
                ['name' => 'Transport & Maintenance', 'scope' => 'private', 'owner' => 'abi', 'amount' => 1300000, 'default_pockets' => [['account' => 'Bank Abi', 'pocket' => 'Transport & Maintenance'], ['account' => 'Tunai Abi', 'pocket' => 'Utama']]],
                ['name' => 'Tagihan Tetap',           'scope' => 'private', 'owner' => 'abi', 'amount' => 1750000, 'default_pockets' => [['account' => 'Bank Abi', 'pocket' => 'Tagihan Tetap']]],
                ['name' => 'Personal & Hobby',        'scope' => 'private', 'owner' => 'abi', 'amount' => 950000,  'default_pockets' => [['account' => 'Bank Abi', 'pocket' => 'Personal & Hobby'], ['account' => 'Paylater Abi', 'pocket' => 'Utama']]],
                ['name' => 'Professional Growth',     'scope' => 'private', 'owner' => 'abi', 'amount' => 1400000, 'default_pockets' => [['account' => 'Bank Abi', 'pocket' => 'Professional Growth']]],
                ['name' => 'Layanan Digital',         'scope' => 'private', 'owner' => 'abi', 'amount' => 500000,  'default_pockets' => [['account' => 'Bank Abi', 'pocket' => 'Layanan Digital'], ['account' => 'Kredit Abi', 'pocket' => 'Utama']]],
                ['name' => 'Peralatan & Gadget',      'scope' => 'private', 'owner' => 'abi', 'amount' => 2600000, 'default_pockets' => [['account' => 'Bank Abi', 'pocket' => 'Peralatan & Gadget'], ['account' => 'Kredit Abi', 'pocket' => 'Utama']]],
                // === Umma — spending wallets only ===
                ['name' => 'Belanja Dapur & RT', 'scope' => 'private', 'owner' => 'umma', 'amount' => 3200000, 'default_pockets' => [['account' => 'Bank Umma', 'pocket' => 'Belanja Dapur & RT']]],
                ['name' => 'Gaji ART & Staff',   'scope' => 'private', 'owner' => 'umma', 'amount' => 1850000, 'default_pockets' => [['account' => 'Bank Umma', 'pocket' => 'Gaji ART & Staff']]],
                ['name' => 'Perawatan Diri',      'scope' => 'private', 'owner' => 'umma', 'amount' => 1100000, 'default_pockets' => [['account' => 'Bank Umma', 'pocket' => 'Perawatan Diri'], ['account' => 'Kredit Umma', 'pocket' => 'Utama'], ['account' => 'Paylater Umma', 'pocket' => 'Utama']]],
                ['name' => 'Peralatan & Gadget',  'scope' => 'private', 'owner' => 'umma', 'amount' => 2600000, 'default_pockets' => [['account' => 'Bank Umma', 'pocket' => 'Peralatan & Gadget'], ['account' => 'Kredit Umma', 'pocket' => 'Utama']]],
                ['name' => 'Makan Luar & Jajan',  'scope' => 'private', 'owner' => 'umma', 'amount' => 600000,  'default_pockets' => [['account' => 'Bank Umma', 'pocket' => 'Makan Luar & Jajan'], ['account' => 'Tunai Umma', 'pocket' => 'Utama']]],
                ['name' => 'Sosial & Kado',       'scope' => 'private', 'owner' => 'umma', 'amount' => 450000,  'default_pockets' => [['account' => 'Bank Umma', 'pocket' => 'Sosial & Kado']]],
                // === Anak (Kakak) — spending wallets only ===
                ['name' => 'SPP & Sekolah Rutin', 'scope' => 'private', 'owner' => 'kakak', 'amount' => 2500000, 'default_pockets' => [['account' => 'Bank Anak', 'pocket' => 'SPP & Sekolah Rutin']]],
                ['name' => 'Kebutuhan Balita',    'scope' => 'private', 'owner' => 'kakak', 'amount' => 900000,  'default_pockets' => [['account' => 'Bank Anak', 'pocket' => 'Kebutuhan Balita']]],
                ['name' => 'Jajan & Mainan',      'scope' => 'private', 'owner' => 'kakak', 'amount' => 550000,  'default_pockets' => [['account' => 'Bank Anak', 'pocket' => 'Jajan & Mainan'], ['account' => 'Tunai Anak', 'pocket' => 'Utama'], ['account' => 'eWallet Anak', 'pocket' => 'Utama']]],
                // === Shared Bisnis — spending wallets only ===
                ['name' => 'Operasional Bisnis', 'scope' => 'shared', 'owner' => 'owner', 'amount' => 4000000, 'default_pockets' => [['account' => 'Bank Bisnis', 'pocket' => 'Operasional Bisnis']]],
                ['name' => 'Marketing Bisnis',   'scope' => 'shared', 'owner' => 'owner', 'amount' => 1800000, 'default_pockets' => [['account' => 'Bank Bisnis', 'pocket' => 'Marketing Bisnis']]],
                // === Shared Darurat — hanya spending wallets (kesehatan & perbaikan) ===
                ['name' => 'Kesehatan & Medis', 'scope' => 'shared', 'owner' => 'owner', 'amount' => 1200000, 'default_pockets' => [['account' => 'Bank Darurat', 'pocket' => 'Kesehatan & Medis']]],
                ['name' => 'Perbaikan Rumah',   'scope' => 'shared', 'owner' => 'owner', 'amount' => 1400000, 'default_pockets' => [['account' => 'Bank Darurat', 'pocket' => 'Perbaikan Rumah']]],
                // DIHAPUS: Penerimaan Pendapatan (Abi), Penerimaan Lainnya (Abi),
                //          Penerimaan Pendapatan (Bisnis), Penerimaan Hadiah (Kakak),
                //          Penerimaan Investasi, Laba Ditahan, Dana Siaga,
                //          Dana Pendidikan Masa Depan, Transfer Internal
                // => Wallet income & saving tidak perlu spending budget.
            ],
            default => [],
        };
    }

    public static function planningBlueprints(): array
    {
        return [
            'goals' => [
                ['name' => 'Dana Depan', 'pocket' => 'Dana Pendidikan Masa Depan', 'amount' => 18000000, 'current' => 5200000, 'months' => 24],
                ['name' => 'Dana Siaga', 'pocket' => 'Dana Siaga', 'amount' => 15000000, 'current' => 4800000, 'months' => 18],
            ],
            'wishes' => [
                ['title' => 'Laptop Anak', 'goal' => 'Dana Depan', 'amount' => 6500000, 'priority' => 'high', 'status' => 'pending'],
                ['title' => 'Servis Besar', 'goal' => null, 'amount' => 2400000, 'priority' => 'medium', 'status' => 'approved'],
            ],
        ];
    }

    public static function demoTransactions(string $tenantSlug): array
    {
        return match ($tenantSlug) {
            'free' => [
                self::single(
                    'FREE-FIN-001',
                    'Pendapatan Aktif',
                    TransactionType::PEMASUKAN,
                    'owner',
                    'Bank Owner',
                    'Utama',
                    null,
                    4500000,
                    '2026-03-01',
                    'Gaji bulanan masuk',
                    PaymentMethod::TRANSFER,
                    ['Bulanan']
                ),
                self::single(
                    'FREE-FIN-002',
                    'Tagihan Utilitas',
                    TransactionType::PENGELUARAN,
                    'owner',
                    'Bank Owner',
                    'Utama',
                    'Tagihan Tetap',
                    525000,
                    '2026-03-28',
                    'Bayar listrik dan air',
                    PaymentMethod::TRANSFER,
                    ['Bulanan', 'Keluarga']
                ),
                self::single(
                    'FREE-FIN-003',
                    'Bahan Makanan',
                    TransactionType::PENGELUARAN,
                    'owner',
                    'Bank Owner',
                    'Utama',
                    'Belanja Dapur & RT',
                    285000,
                    '2026-04-03',
                    'Belanja pasar harian',
                    PaymentMethod::TRANSFER,
                    ['Harian', 'Keluarga']
                ),
                self::single(
                    'FREE-FIN-004',
                    'Konsumsi Restoran',
                    TransactionType::PENGELUARAN,
                    'owner',
                    'Tunai Owner',
                    'Utama',
                    null,
                    95000,
                    '2026-04-05',
                    'Makan keluarga sederhana',
                    PaymentMethod::TUNAI,
                    ['Harian', 'Keluarga']
                ),
            ],
            'pro' => [
                self::single('PRO-FIN-001', 'Pendapatan Aktif', TransactionType::PEMASUKAN, 'owner', 'Bank Owner', 'Utama', null, 6500000, '2026-03-01', 'Honor bulanan masuk', PaymentMethod::TRANSFER, ['Bulanan']),
                self::single('PRO-FIN-002', 'Pendapatan Aktif', TransactionType::PEMASUKAN, 'owner', 'Bank Owner', 'Utama', null, 6600000, '2026-04-01', 'Pendapatan aktif awal bulan', PaymentMethod::TRANSFER, ['Bulanan']),
                self::transfer('PRO-FIN-101', 'Mutasi Antar Akun', 'owner', 'Bank Owner', 'Utama', 'Tagihan Tetap', 680000, '2026-03-27', 'Alokasi dana tagihan tetap', 'PRO-TRF-TAG-01', 'out', ['Transfer', 'Keluarga']),
                self::transfer('PRO-FIN-102', 'Mutasi Antar Akun', 'owner', 'Bank Owner', 'Tagihan Tetap', 'Tagihan Tetap', 680000, '2026-03-27', 'Wallet tagihan menerima alokasi', 'PRO-TRF-TAG-01', 'in', ['Transfer', 'Keluarga']),
                self::transfer('PRO-FIN-103', 'Mutasi Antar Akun', 'owner', 'Bank Owner', 'Utama', 'Transport & Maintenance', 275000, '2026-04-01', 'Alokasi dana transport', 'PRO-TRF-TRN-01', 'out', ['Transfer', 'Personal']),
                self::transfer('PRO-FIN-104', 'Mutasi Antar Akun', 'owner', 'Bank Owner', 'Transport & Maintenance', 'Transport & Maintenance', 275000, '2026-04-01', 'Wallet transport menerima alokasi', 'PRO-TRF-TRN-01', 'in', ['Transfer', 'Personal']),
                self::transfer('PRO-FIN-105', 'Mutasi Antar Akun', 'owner', 'Bank Owner', 'Utama', 'Belanja Dapur & RT', 435000, '2026-04-02', 'Alokasi belanja rumah tangga', 'PRO-TRF-RT-01', 'out', ['Transfer', 'Keluarga']),
                self::transfer('PRO-FIN-106', 'Mutasi Antar Akun', 'owner', 'Bank Owner', 'Belanja Dapur & RT', 'Belanja Dapur & RT', 435000, '2026-04-02', 'Wallet rumah tangga menerima alokasi', 'PRO-TRF-RT-01', 'in', ['Transfer', 'Keluarga']),
                self::transfer('PRO-FIN-107', 'Mutasi Antar Akun', 'owner', 'eWallet Owner', 'Utama', 'Makan Luar & Jajan', 125000, '2026-04-04', 'Alokasi makan luar', 'PRO-TRF-EAT-01', 'out', ['Transfer', 'Personal']),
                self::transfer('PRO-FIN-108', 'Mutasi Antar Akun', 'owner', 'eWallet Owner', 'Makan Luar & Jajan', 'Makan Luar & Jajan', 125000, '2026-04-04', 'Wallet makan luar menerima alokasi', 'PRO-TRF-EAT-01', 'in', ['Transfer', 'Personal']),
                self::single('PRO-FIN-003', 'Bahan Bakar Kendaraan', TransactionType::PENGELUARAN, 'owner', 'Bank Owner', 'Transport & Maintenance', 'Transport & Maintenance', 275000, '2026-04-02', 'Isi bensin mingguan', PaymentMethod::KARTU_DEBIT, ['Harian', 'Personal']),
                self::single('PRO-FIN-004', 'Tagihan Utilitas', TransactionType::PENGELUARAN, 'owner', 'Bank Owner', 'Tagihan Tetap', 'Tagihan Tetap', 680000, '2026-03-28', 'Bayar listrik dan iuran lingkungan', PaymentMethod::TRANSFER, ['Bulanan', 'Keluarga']),
                self::bulk('PRO-FIN-005', 'PRO-BULK-RT-01', 'Bahan Makanan', TransactionType::PENGELUARAN, 'owner', 'Bank Owner', 'Belanja Dapur & RT', 'Belanja Dapur & RT', 245000, '2026-04-03', 'Belanja sayur dan lauk', PaymentMethod::TRANSFER, ['Harian', 'Keluarga']),
                self::bulk('PRO-FIN-006', 'PRO-BULK-RT-01', 'Kebutuhan Pokok', TransactionType::PENGELUARAN, 'owner', 'Bank Owner', 'Belanja Dapur & RT', 'Belanja Dapur & RT', 190000, '2026-04-03', 'Belanja beras dan telur', PaymentMethod::TRANSFER, ['Bulanan', 'Keluarga']),
                self::single('PRO-FIN-007', 'Konsumsi Restoran', TransactionType::PENGELUARAN, 'owner', 'eWallet Owner', 'Makan Luar & Jajan', 'Makan Luar & Jajan', 125000, '2026-04-05', 'Makan malam akhir pekan', PaymentMethod::DOMPET_DIGITAL, ['Harian', 'Personal']),
            ],
            'business' => [
                self::single('BUS-FIN-001', 'Pendapatan Aktif', TransactionType::PEMASUKAN, 'owner', 'Bank Owner', 'Utama', null, 7800000, '2026-03-01', 'Pendapatan aktif bulanan', PaymentMethod::TRANSFER, ['Bulanan']),
                self::single('BUS-FIN-002', 'Pendapatan Aktif', TransactionType::PEMASUKAN, 'owner', 'Bank Bisnis', 'Utama', null, 9200000, '2026-04-01', 'Omzet usaha masuk', PaymentMethod::TRANSFER, ['Bulanan', 'Bisnis']),
                self::transfer('BUS-FIN-101', 'Mutasi Antar Akun', 'owner', 'Bank Owner', 'Utama', 'Tagihan Tetap', 740000, '2026-03-28', 'Alokasi tagihan rumah', 'BUS-TRF-TAG-01', 'out', ['Transfer', 'Keluarga']),
                self::transfer('BUS-FIN-102', 'Mutasi Antar Akun', 'owner', 'Bank Owner', 'Tagihan Tetap', 'Tagihan Tetap', 740000, '2026-03-28', 'Wallet tagihan menerima alokasi', 'BUS-TRF-TAG-01', 'in', ['Transfer', 'Keluarga']),
                self::transfer('BUS-FIN-103', 'Mutasi Antar Akun', 'owner', 'Bank Owner', 'Utama', 'Belanja Dapur & RT', 315000, '2026-04-01', 'Alokasi belanja dapur', 'BUS-TRF-RT-01', 'out', ['Transfer', 'Keluarga']),
                self::transfer('BUS-FIN-104', 'Mutasi Antar Akun', 'owner', 'Bank Owner', 'Belanja Dapur & RT', 'Belanja Dapur & RT', 315000, '2026-04-01', 'Wallet dapur menerima alokasi', 'BUS-TRF-RT-01', 'in', ['Transfer', 'Keluarga']),
                self::transfer('BUS-FIN-105', 'Mutasi Antar Akun', 'owner', 'Bank Bisnis', 'Utama', 'Operasional Bisnis', 1800000, '2026-03-15', 'Alokasi operasional bisnis', 'BUS-TRF-OPS-01', 'out', ['Transfer', 'Bisnis']),
                self::transfer('BUS-FIN-106', 'Mutasi Antar Akun', 'owner', 'Bank Bisnis', 'Operasional Bisnis', 'Operasional Bisnis', 1800000, '2026-03-15', 'Wallet operasional menerima alokasi', 'BUS-TRF-OPS-01', 'in', ['Transfer', 'Bisnis']),
                self::transfer('BUS-FIN-107', 'Mutasi Antar Akun', 'owner', 'Bank Bisnis', 'Utama', 'Marketing Bisnis', 775000, '2026-03-21', 'Alokasi marketing bisnis', 'BUS-TRF-MKT-01', 'out', ['Transfer', 'Bisnis']),
                self::transfer('BUS-FIN-108', 'Mutasi Antar Akun', 'owner', 'Bank Bisnis', 'Marketing Bisnis', 'Marketing Bisnis', 775000, '2026-03-21', 'Wallet marketing menerima alokasi', 'BUS-TRF-MKT-01', 'in', ['Transfer', 'Bisnis']),
                self::single('BUS-FIN-003', 'Tagihan Utilitas', TransactionType::PENGELUARAN, 'owner', 'Bank Owner', 'Tagihan Tetap', 'Tagihan Tetap', 740000, '2026-03-29', 'Bayar utilitas rumah', PaymentMethod::TRANSFER, ['Bulanan', 'Keluarga']),
                self::single('BUS-FIN-004', 'Bahan Makanan', TransactionType::PENGELUARAN, 'owner', 'Bank Owner', 'Belanja Dapur & RT', 'Belanja Dapur & RT', 315000, '2026-04-02', 'Belanja dapur mingguan', PaymentMethod::TRANSFER, ['Harian', 'Keluarga']),
                self::bulk('BUS-FIN-005', 'BUS-BULK-BIZ-01', 'Stok & Bahan Baku', TransactionType::PENGELUARAN, 'owner', 'Bank Bisnis', 'Operasional Bisnis', 'Operasional Bisnis', 1150000, '2026-04-02', 'Belanja stok servis rutin', PaymentMethod::TRANSFER, ['Bulanan', 'Bisnis']),
                self::bulk('BUS-FIN-006', 'BUS-BULK-BIZ-01', 'Legalitas & Sewa Bisnis', TransactionType::PENGELUARAN, 'owner', 'Bank Bisnis', 'Operasional Bisnis', 'Operasional Bisnis', 650000, '2026-03-15', 'Biaya maintenance tempat usaha', PaymentMethod::TRANSFER, ['Bulanan', 'Bisnis']),
                self::single('BUS-FIN-007', 'Periklanan & Ads', TransactionType::PENGELUARAN, 'owner', 'Bank Bisnis', 'Marketing Bisnis', 'Marketing Bisnis', 425000, '2026-04-03', 'Iklan promosi konten', PaymentMethod::TRANSFER, ['Bulanan', 'Bisnis']),
                self::single('BUS-FIN-008', 'Produksi Konten', TransactionType::PENGELUARAN, 'owner', 'Bank Bisnis', 'Marketing Bisnis', 'Marketing Bisnis', 350000, '2026-03-21', 'Bayar editor video', PaymentMethod::TRANSFER, ['Bulanan', 'Bisnis']),
            ],
            'enterprise' => self::enterpriseTransactions(),
            default => [],
        };
    }

    public static function assertCompactName(string $name): void
    {
        $normalized = preg_replace('/[&\/-]+/', ' ', trim($name));
        $words = preg_split('/\s+/', (string) $normalized, -1, PREG_SPLIT_NO_EMPTY);

        if (count($words) > 4) {
            throw new InvalidArgumentException("Seed name [{$name}] exceeds the compact seed limit.");
        }
    }

    private static function enterpriseTransactions(): array
    {
        return [
            self::single('ENT-FIN-001', 'Pendapatan Aktif', TransactionType::PEMASUKAN, 'abi', 'Bank Abi', 'Penerimaan Pendapatan', null, 12500000, '2026-03-01', 'Honor bulanan klien utama', PaymentMethod::TRANSFER, ['Bulanan', 'Personal']),
            self::single('ENT-FIN-002', 'Pendapatan Aktif', TransactionType::PEMASUKAN, 'abi', 'Bank Bisnis', 'Penerimaan Pendapatan', null, 18250000, '2026-04-01', 'Omzet usaha periode berjalan', PaymentMethod::TRANSFER, ['Bulanan', 'Bisnis']),
            self::single('ENT-FIN-003', 'Hadiah & Angpao', TransactionType::PEMASUKAN, 'adik', 'Bank Anak', 'Penerimaan Hadiah', null, 950000, '2026-03-15', 'Angpao dari keluarga besar', PaymentMethod::TRANSFER, ['Bulanan', 'Anak']),
            self::single('ENT-FIN-004', 'Return Investasi', TransactionType::PEMASUKAN, 'umma', 'Bank Darurat', 'Penerimaan Investasi', null, 420000, '2026-04-15', 'Bagi hasil investasi bulanan', PaymentMethod::TRANSFER, ['Bulanan', 'Darurat']),
            self::single('ENT-FIN-005', 'Penjualan Aset/Barang', TransactionType::PEMASUKAN, 'abi', 'Bank Abi', 'Penerimaan Lainnya', null, 1750000, '2026-03-15', 'Jual velg bekas koleksi', PaymentMethod::TRANSFER, ['Bulanan', 'Personal']),

            self::transfer('ENT-FIN-101', 'Mutasi Antar Akun', 'abi', 'Bank Abi', 'Penerimaan Pendapatan', 'Professional Growth', 1115000, '2026-03-01', 'Alokasi dana growth', 'ENT-TRF-GRO-01', 'out', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-102', 'Mutasi Antar Akun', 'abi', 'Bank Abi', 'Professional Growth', 'Professional Growth', 1115000, '2026-03-01', 'Wallet growth menerima alokasi', 'ENT-TRF-GRO-01', 'in', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-103', 'Mutasi Antar Akun', 'abi', 'Bank Abi', 'Penerimaan Pendapatan', 'Transport & Maintenance', 1270000, '2026-03-04', 'Alokasi dana transport', 'ENT-TRF-TRN-01', 'out', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-104', 'Mutasi Antar Akun', 'abi', 'Bank Abi', 'Transport & Maintenance', 'Transport & Maintenance', 1270000, '2026-03-04', 'Wallet transport menerima alokasi', 'ENT-TRF-TRN-01', 'in', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-105', 'Mutasi Antar Akun', 'abi', 'Bank Abi', 'Penerimaan Pendapatan', 'Tagihan Tetap', 4704000, '2026-03-14', 'Alokasi tagihan tetap', 'ENT-TRF-TAG-01', 'out', ['Transfer', 'Keluarga']),
            self::transfer('ENT-FIN-106', 'Mutasi Antar Akun', 'abi', 'Bank Abi', 'Tagihan Tetap', 'Tagihan Tetap', 4704000, '2026-03-14', 'Wallet tagihan menerima alokasi', 'ENT-TRF-TAG-01', 'in', ['Transfer', 'Keluarga']),
            self::transfer('ENT-FIN-107', 'Mutasi Antar Akun', 'abi', 'Bank Abi', 'Penerimaan Pendapatan', 'Personal & Hobby', 720000, '2026-03-16', 'Alokasi dana personal', 'ENT-TRF-HBY-01', 'out', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-108', 'Mutasi Antar Akun', 'abi', 'Bank Abi', 'Personal & Hobby', 'Personal & Hobby', 720000, '2026-03-16', 'Wallet personal menerima alokasi', 'ENT-TRF-HBY-01', 'in', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-109', 'Mutasi Antar Akun', 'abi', 'Bank Abi', 'Penerimaan Pendapatan', 'Layanan Digital', 420000, '2026-03-18', 'Alokasi layanan digital', 'ENT-TRF-DIG-01', 'out', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-110', 'Mutasi Antar Akun', 'abi', 'Bank Abi', 'Layanan Digital', 'Layanan Digital', 420000, '2026-03-18', 'Wallet digital menerima alokasi', 'ENT-TRF-DIG-01', 'in', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-141', 'Mutasi Antar Akun', 'abi', 'Bank Abi', 'Penerimaan Lainnya', 'Peralatan & Gadget', 1650000, '2026-03-19', 'Alokasi gadget dan perabot', 'ENT-TRF-GDT-01', 'out', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-142', 'Mutasi Antar Akun', 'abi', 'Bank Abi', 'Peralatan & Gadget', 'Peralatan & Gadget', 1650000, '2026-03-19', 'Wallet gadget menerima alokasi', 'ENT-TRF-GDT-01', 'in', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-111', 'Mutasi Antar Akun', 'umma', 'Bank Umma', 'Utama', 'Perawatan Diri', 1320000, '2026-03-10', 'Alokasi perawatan diri', 'ENT-TRF-CARE-01', 'out', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-112', 'Mutasi Antar Akun', 'umma', 'Bank Umma', 'Perawatan Diri', 'Perawatan Diri', 1320000, '2026-03-10', 'Wallet perawatan menerima alokasi', 'ENT-TRF-CARE-01', 'in', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-113', 'Mutasi Antar Akun', 'umma', 'Bank Umma', 'Utama', 'Belanja Dapur & RT', 2570000, '2026-03-12', 'Alokasi rumah tangga', 'ENT-TRF-RT-01', 'out', ['Transfer', 'Keluarga']),
            self::transfer('ENT-FIN-114', 'Mutasi Antar Akun', 'umma', 'Bank Umma', 'Belanja Dapur & RT', 'Belanja Dapur & RT', 2570000, '2026-03-12', 'Wallet rumah tangga menerima alokasi', 'ENT-TRF-RT-01', 'in', ['Transfer', 'Keluarga']),
            self::transfer('ENT-FIN-151', 'Mutasi Antar Akun', 'umma', 'Bank Umma', 'Utama', 'Peralatan & Gadget', 1580000, '2026-03-12', 'Alokasi furnitur dan perabot', 'ENT-TRF-GDG-UM-01', 'out', ['Transfer', 'Keluarga']),
            self::transfer('ENT-FIN-152', 'Mutasi Antar Akun', 'umma', 'Bank Umma', 'Peralatan & Gadget', 'Peralatan & Gadget', 1580000, '2026-03-12', 'Wallet gadget menerima alokasi', 'ENT-TRF-GDG-UM-01', 'in', ['Transfer', 'Keluarga']),
            self::transfer('ENT-FIN-115', 'Mutasi Antar Akun', 'umma', 'Bank Umma', 'Utama', 'Gaji ART & Staff', 2550000, '2026-03-15', 'Alokasi staf rumah', 'ENT-TRF-STAFF-01', 'out', ['Transfer', 'Keluarga']),
            self::transfer('ENT-FIN-116', 'Mutasi Antar Akun', 'umma', 'Bank Umma', 'Gaji ART & Staff', 'Gaji ART & Staff', 2550000, '2026-03-15', 'Wallet staf menerima alokasi', 'ENT-TRF-STAFF-01', 'in', ['Transfer', 'Keluarga']),
            self::transfer('ENT-FIN-117', 'Mutasi Antar Akun', 'umma', 'Bank Umma', 'Utama', 'Sosial & Kado', 225000, '2026-03-22', 'Alokasi sosial dan kado', 'ENT-TRF-SOS-01', 'out', ['Transfer', 'Keluarga']),
            self::transfer('ENT-FIN-118', 'Mutasi Antar Akun', 'umma', 'Bank Umma', 'Sosial & Kado', 'Sosial & Kado', 225000, '2026-03-22', 'Wallet sosial menerima alokasi', 'ENT-TRF-SOS-01', 'in', ['Transfer', 'Keluarga']),
            self::transfer('ENT-FIN-119', 'Mutasi Antar Akun', 'umma', 'Bank Umma', 'Utama', 'Makan Luar & Jajan', 285000, '2026-04-01', 'Alokasi makan luar', 'ENT-TRF-EAT-01', 'out', ['Transfer', 'Keluarga']),
            self::transfer('ENT-FIN-120', 'Mutasi Antar Akun', 'umma', 'Bank Umma', 'Makan Luar & Jajan', 'Makan Luar & Jajan', 285000, '2026-04-01', 'Wallet makan luar menerima alokasi', 'ENT-TRF-EAT-01', 'in', ['Transfer', 'Keluarga']),
            self::transfer('ENT-FIN-143', 'Mutasi Antar Akun', 'umma', 'Bank Umma', 'Utama', 'Tunai Umma', 180000, '2026-04-02', 'Tarik tunai belanja cepat', 'ENT-TRF-CASH-UM-01', 'out', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-144', 'Mutasi Antar Akun', 'umma', 'Tunai Umma', 'Utama', 'Utama', 180000, '2026-04-02', 'Kas Umma menerima dana', 'ENT-TRF-CASH-UM-01', 'in', ['Transfer', 'Personal']),

            self::transfer('ENT-FIN-121', 'Mutasi Antar Akun', 'kakak', 'Bank Anak', 'Utama', 'SPP & Sekolah Rutin', 1685000, '2026-03-05', 'Alokasi sekolah rutin', 'ENT-TRF-SKL-01', 'out', ['Transfer', 'Anak']),
            self::transfer('ENT-FIN-122', 'Mutasi Antar Akun', 'kakak', 'Bank Anak', 'SPP & Sekolah Rutin', 'SPP & Sekolah Rutin', 1685000, '2026-03-05', 'Wallet sekolah menerima alokasi', 'ENT-TRF-SKL-01', 'in', ['Transfer', 'Anak']),
            self::transfer('ENT-FIN-123', 'Mutasi Antar Akun', 'adik', 'Bank Anak', 'Utama', 'Kebutuhan Balita', 770000, '2026-03-05', 'Alokasi kebutuhan balita', 'ENT-TRF-BAL-01', 'out', ['Transfer', 'Anak']),
            self::transfer('ENT-FIN-124', 'Mutasi Antar Akun', 'adik', 'Bank Anak', 'Kebutuhan Balita', 'Kebutuhan Balita', 770000, '2026-03-05', 'Wallet balita menerima alokasi', 'ENT-TRF-BAL-01', 'in', ['Transfer', 'Anak']),
            self::transfer('ENT-FIN-145', 'Mutasi Antar Akun', 'kakak', 'Bank Anak', 'Penerimaan Hadiah', 'Jajan & Mainan', 210000, '2026-03-25', 'Alokasi jajan dan mainan', 'ENT-TRF-PLAY-01', 'out', ['Transfer', 'Anak']),
            self::transfer('ENT-FIN-146', 'Mutasi Antar Akun', 'kakak', 'Bank Anak', 'Jajan & Mainan', 'Jajan & Mainan', 210000, '2026-03-25', 'Wallet jajan menerima alokasi', 'ENT-TRF-PLAY-01', 'in', ['Transfer', 'Anak']),
            self::transfer('ENT-FIN-149', 'Mutasi Antar Akun', 'kakak', 'Bank Anak', 'Penerimaan Hadiah', 'SPP & Sekolah Rutin', 400000, '2026-03-16', 'Alokasi hadiah ke dana sekolah', 'ENT-TRF-GIFT-SKL-01', 'out', ['Transfer', 'Anak']),
            self::transfer('ENT-FIN-150', 'Mutasi Antar Akun', 'kakak', 'Bank Anak', 'SPP & Sekolah Rutin', 'SPP & Sekolah Rutin', 400000, '2026-03-16', 'Dana sekolah menerima alokasi hadiah', 'ENT-TRF-GIFT-SKL-01', 'in', ['Transfer', 'Anak']),

            self::transfer('ENT-FIN-125', 'Mutasi Antar Akun', 'abi', 'Bank Bisnis', 'Utama', 'Operasional Bisnis', 3100000, '2026-03-15', 'Alokasi operasional bisnis', 'ENT-TRF-BIZ-OPS-01', 'out', ['Transfer', 'Bisnis']),
            self::transfer('ENT-FIN-126', 'Mutasi Antar Akun', 'abi', 'Bank Bisnis', 'Operasional Bisnis', 'Operasional Bisnis', 3100000, '2026-03-15', 'Wallet operasional menerima alokasi', 'ENT-TRF-BIZ-OPS-01', 'in', ['Transfer', 'Bisnis']),
            self::transfer('ENT-FIN-127', 'Mutasi Antar Akun', 'abi', 'Bank Bisnis', 'Utama', 'Marketing Bisnis', 1125000, '2026-03-21', 'Alokasi marketing bisnis', 'ENT-TRF-BIZ-MKT-01', 'out', ['Transfer', 'Bisnis']),
            self::transfer('ENT-FIN-128', 'Mutasi Antar Akun', 'abi', 'Bank Bisnis', 'Marketing Bisnis', 'Marketing Bisnis', 1125000, '2026-03-21', 'Wallet marketing menerima alokasi', 'ENT-TRF-BIZ-MKT-01', 'in', ['Transfer', 'Bisnis']),

            self::transfer('ENT-FIN-129', 'Mutasi Antar Akun', 'umma', 'Bank Darurat', 'Utama', 'Kesehatan & Medis', 560000, '2026-03-23', 'Alokasi kesehatan', 'ENT-TRF-MED-01', 'out', ['Transfer', 'Darurat']),
            self::transfer('ENT-FIN-130', 'Mutasi Antar Akun', 'umma', 'Bank Darurat', 'Kesehatan & Medis', 'Kesehatan & Medis', 560000, '2026-03-23', 'Wallet kesehatan menerima alokasi', 'ENT-TRF-MED-01', 'in', ['Transfer', 'Darurat']),
            self::transfer('ENT-FIN-131', 'Mutasi Antar Akun', 'umma', 'Bank Darurat', 'Utama', 'Perbaikan Rumah', 1325000, '2026-03-27', 'Alokasi perbaikan rumah', 'ENT-TRF-HOME-01', 'out', ['Transfer', 'Keluarga']),
            self::transfer('ENT-FIN-132', 'Mutasi Antar Akun', 'umma', 'Bank Darurat', 'Perbaikan Rumah', 'Perbaikan Rumah', 1325000, '2026-03-27', 'Wallet rumah menerima alokasi', 'ENT-TRF-HOME-01', 'in', ['Transfer', 'Keluarga']),
            self::transfer('ENT-FIN-147', 'Mutasi Antar Akun', 'umma', 'Bank Darurat', 'Utama', 'Transfer Internal', 450000, '2026-04-06', 'Alokasi mutasi internal', 'ENT-TRF-INT-01', 'out', ['Transfer', 'Darurat']),
            self::transfer('ENT-FIN-148', 'Mutasi Antar Akun', 'umma', 'Bank Darurat', 'Transfer Internal', 'Transfer Internal', 450000, '2026-04-06', 'Wallet mutasi menerima dana', 'ENT-TRF-INT-01', 'in', ['Transfer', 'Darurat']),

            self::single('ENT-FIN-006', 'Bahan Bakar Kendaraan', TransactionType::PENGELUARAN, 'abi', 'Bank Abi', 'Transport & Maintenance', 'Transport & Maintenance', 325000, '2026-04-04', 'Isi bensin mobil keluarga', PaymentMethod::KARTU_DEBIT, ['Harian', 'Personal']),
            self::single('ENT-FIN-007', 'Tol & Parkir', TransactionType::PENGELUARAN, 'abi', 'Tunai Abi', 'Utama', 'Transport & Maintenance', 85000, '2026-04-04', 'Tol kota dan parkir kerja', PaymentMethod::TUNAI, ['Harian', 'Personal']),
            self::single('ENT-FIN-008', 'Perawatan Kendaraan', TransactionType::PENGELUARAN, 'abi', 'Bank Abi', 'Transport & Maintenance', 'Transport & Maintenance', 945000, '2026-03-05', 'Servis rutin dan ganti oli', PaymentMethod::TRANSFER, ['Bulanan', 'Personal']),

            self::single('ENT-FIN-009', 'Layanan Internet & TV', TransactionType::PENGELUARAN, 'abi', 'Bank Abi', 'Tagihan Tetap', 'Tagihan Tetap', 489000, '2026-03-28', 'Bayar internet rumah dan TV', PaymentMethod::TRANSFER, ['Bulanan', 'Keluarga']),
            self::single('ENT-FIN-010', 'Tagihan Utilitas', TransactionType::PENGELUARAN, 'abi', 'Bank Abi', 'Tagihan Tetap', 'Tagihan Tetap', 715000, '2026-03-29', 'Bayar listrik air dan iuran', PaymentMethod::TRANSFER, ['Bulanan', 'Keluarga']),
            self::single('ENT-FIN-011', 'Asuransi Proteksi', TransactionType::PENGELUARAN, 'abi', 'Bank Abi', 'Tagihan Tetap', 'Tagihan Tetap', 650000, '2026-03-26', 'Premi asuransi keluarga', PaymentMethod::TRANSFER, ['Bulanan', 'Keluarga']),
            self::single('ENT-FIN-012', 'Pajak Tahunan', TransactionType::PENGELUARAN, 'abi', 'Bank Abi', 'Tagihan Tetap', 'Tagihan Tetap', 2850000, '2026-03-15', 'Bayar pajak kendaraan tahunan', PaymentMethod::TRANSFER, ['Bulanan', 'Personal']),

            self::single('ENT-FIN-013', 'Hobi & Koleksi', TransactionType::PENGELUARAN, 'abi', 'Bank Abi', 'Personal & Hobby', 'Personal & Hobby', 475000, '2026-03-23', 'Tambah koleksi model kit', PaymentMethod::KARTU_DEBIT, ['Bulanan', 'Personal']),
            self::single('ENT-FIN-014', 'Konsumsi Relaksasi', TransactionType::PENGELUARAN, 'abi', 'Tunai Abi', 'Utama', 'Personal & Hobby', 68000, '2026-04-05', 'Kopi kerja dan camilan', PaymentMethod::TUNAI, ['Harian', 'Personal']),
            self::single('ENT-FIN-015', 'Penampilan Pribadi', TransactionType::PENGELUARAN, 'abi', 'Bank Abi', 'Personal & Hobby', 'Personal & Hobby', 245000, '2026-03-17', 'Potong rambut dan kaos harian', PaymentMethod::KARTU_DEBIT, ['Bulanan', 'Personal']),

            self::single('ENT-FIN-016', 'Edukasi & Pelatihan', TransactionType::PENGELUARAN, 'abi', 'Bank Abi', 'Professional Growth', 'Professional Growth', 725000, '2026-03-01', 'Kelas leadership daring', PaymentMethod::TRANSFER, ['Bulanan', 'Personal']),
            self::single('ENT-FIN-017', 'Relasi Bisnis', TransactionType::PENGELUARAN, 'abi', 'Bank Abi', 'Professional Growth', 'Professional Growth', 390000, '2026-03-24', 'Jamuan klien proyek baru', PaymentMethod::KARTU_DEBIT, ['Bulanan', 'Bisnis']),

            self::bulk('ENT-FIN-018', 'ENT-BULK-RT-01', 'Bahan Makanan', TransactionType::PENGELUARAN, 'umma', 'Bank Umma', 'Belanja Dapur & RT', 'Belanja Dapur & RT', 315000, '2026-04-03', 'Belanja sayur dan lauk segar', PaymentMethod::TRANSFER, ['Harian', 'Keluarga']),
            self::bulk('ENT-FIN-019', 'ENT-BULK-RT-01', 'Kebutuhan Pokok', TransactionType::PENGELUARAN, 'umma', 'Bank Umma', 'Belanja Dapur & RT', 'Belanja Dapur & RT', 265000, '2026-04-03', 'Belanja beras telur dan minyak', PaymentMethod::TRANSFER, ['Bulanan', 'Keluarga']),
            self::bulk('ENT-FIN-020', 'ENT-BULK-RT-01', 'Sanitasi & Kebersihan', TransactionType::PENGELUARAN, 'umma', 'Bank Umma', 'Belanja Dapur & RT', 'Belanja Dapur & RT', 185000, '2026-04-03', 'Beli sabun galon dan gas', PaymentMethod::TRANSFER, ['Bulanan', 'Keluarga']),
            self::bulk('ENT-FIN-021', 'ENT-BULK-RT-01', 'Perlengkapan Dapur', TransactionType::PENGELUARAN, 'umma', 'Bank Umma', 'Belanja Dapur & RT', 'Belanja Dapur & RT', 225000, '2026-04-03', 'Wadah makan dan alat masak', PaymentMethod::TRANSFER, ['Bulanan', 'Keluarga']),

            self::single('ENT-FIN-022', 'Upah Bantuan Domestik', TransactionType::PENGELUARAN, 'umma', 'Bank Umma', 'Gaji ART & Staff', 'Gaji ART & Staff', 1650000, '2026-04-01', 'Gaji ART bulanan', PaymentMethod::TRANSFER, ['Bulanan', 'Keluarga']),
            self::single('ENT-FIN-023', 'Tunjangan Hari Raya', TransactionType::PENGELUARAN, 'umma', 'Bank Umma', 'Gaji ART & Staff', 'Gaji ART & Staff', 900000, '2026-03-15', 'Alokasi THR staf rumah', PaymentMethod::TRANSFER, ['Bulanan', 'Keluarga']),

            self::single('ENT-FIN-024', 'Estetika & Kosmetik', TransactionType::PENGELUARAN, 'umma', 'Bank Umma', 'Perawatan Diri', 'Perawatan Diri', 355000, '2026-03-31', 'Belanja skincare bulanan', PaymentMethod::KARTU_DEBIT, ['Bulanan', 'Personal']),
            self::single('ENT-FIN-025', 'Perawatan Klinik & Salon', TransactionType::PENGELUARAN, 'umma', 'Bank Umma', 'Perawatan Diri', 'Perawatan Diri', 425000, '2026-03-20', 'Perawatan salon rutin', PaymentMethod::KARTU_DEBIT, ['Bulanan', 'Personal']),
            self::single('ENT-FIN-026', 'Fashion & Pakaian', TransactionType::PENGELUARAN, 'umma', 'Bank Umma', 'Perawatan Diri', 'Perawatan Diri', 540000, '2026-03-10', 'Beli sepatu dan baju harian', PaymentMethod::KARTU_DEBIT, ['Bulanan', 'Personal']),

            self::single('ENT-FIN-027', 'Elektronik & Gadget', TransactionType::PENGELUARAN, 'abi', 'Kredit Abi', 'Utama', 'Peralatan & Gadget', 2350000, '2026-03-13', 'Beli tablet kerja dan keluarga', PaymentMethod::KARTU_KREDIT, ['Bulanan', 'Personal']),
            self::single('ENT-FIN-028', 'Furnitur & Perabotan', TransactionType::PENGELUARAN, 'umma', 'Bank Umma', 'Peralatan & Gadget', 'Peralatan & Gadget', 1580000, '2026-03-12', 'Beli rak dapur dan kursi kecil', PaymentMethod::TRANSFER, ['Bulanan', 'Keluarga']),
            self::single('ENT-FIN-029', 'Subs. & Software', TransactionType::PENGELUARAN, 'abi', 'Kredit Abi', 'Utama', 'Layanan Digital', 289000, '2026-03-27', 'Langganan streaming dan AI tools', PaymentMethod::KARTU_KREDIT, ['Bulanan', 'Personal']),
            self::single('ENT-FIN-057', 'Hobi & Koleksi', TransactionType::PENGELUARAN, 'abi', 'Paylater Abi', 'Utama', 'Personal & Hobby', 210000, '2026-04-08', 'Beli aksesoris hobi via paylater', PaymentMethod::LAINNYA, ['Bulanan', 'Personal']),

            self::single('ENT-FIN-030', 'Konsumsi Restoran', TransactionType::PENGELUARAN, 'umma', 'Bank Umma', 'Makan Luar & Jajan', 'Makan Luar & Jajan', 285000, '2026-04-02', 'Makan luar akhir pekan', PaymentMethod::KARTU_DEBIT, ['Harian', 'Keluarga']),
            self::single('ENT-FIN-031', 'Sumbangan & Donasi', TransactionType::PENGELUARAN, 'umma', 'Bank Umma', 'Sosial & Kado', 'Sosial & Kado', 225000, '2026-03-22', 'Donasi dan hadiah keluarga', PaymentMethod::TRANSFER, ['Bulanan', 'Keluarga']),
            self::single('ENT-FIN-058', 'Konsumsi Restoran', TransactionType::PENGELUARAN, 'umma', 'Tunai Umma', 'Utama', 'Makan Luar & Jajan', 95000, '2026-04-03', 'Jajan cepat setelah belanja', PaymentMethod::TUNAI, ['Harian', 'Personal']),
            self::single('ENT-FIN-059', 'Fashion & Pakaian', TransactionType::PENGELUARAN, 'umma', 'Paylater Umma', 'Utama', 'Perawatan Diri', 275000, '2026-04-04', 'Beli pakaian harian via paylater', PaymentMethod::LAINNYA, ['Bulanan', 'Personal']),
            self::single('ENT-FIN-060', 'Furnitur & Perabotan', TransactionType::PENGELUARAN, 'umma', 'Kredit Umma', 'Utama', 'Peralatan & Gadget', 980000, '2026-03-18', 'Beli rak tambahan dengan kartu kredit', PaymentMethod::KARTU_KREDIT, ['Bulanan', 'Keluarga']),

            self::single('ENT-FIN-032', 'Biaya Pendidikan Utama', TransactionType::PENGELUARAN, 'kakak', 'Bank Anak', 'SPP & Sekolah Rutin', 'SPP & Sekolah Rutin', 1250000, '2026-03-30', 'Bayar SPP bulanan', PaymentMethod::TRANSFER, ['Bulanan', 'Anak']),
            self::single('ENT-FIN-033', 'Pendidikan Tambahan', TransactionType::PENGELUARAN, 'kakak', 'Bank Anak', 'SPP & Sekolah Rutin', 'SPP & Sekolah Rutin', 450000, '2026-03-25', 'Bayar les dan ekskul', PaymentMethod::TRANSFER, ['Bulanan', 'Anak']),
            self::bulk('ENT-FIN-034', 'ENT-BULK-ANAK-01', 'Keperluan Sekolah', TransactionType::PENGELUARAN, 'kakak', 'Bank Anak', 'SPP & Sekolah Rutin', 'SPP & Sekolah Rutin', 385000, '2026-03-05', 'Buku seragam dan kegiatan sekolah', PaymentMethod::TRANSFER, ['Bulanan', 'Anak']),

            self::bulk('ENT-FIN-035', 'ENT-BULK-ANAK-01', 'Nutrisi Balita', TransactionType::PENGELUARAN, 'adik', 'Bank Anak', 'Kebutuhan Balita', 'Kebutuhan Balita', 265000, '2026-03-05', 'Susu UHT dan nutrisi anak', PaymentMethod::TRANSFER, ['Bulanan', 'Anak']),
            self::bulk('ENT-FIN-036', 'ENT-BULK-ANAK-01', 'Perlengkapan Balita', TransactionType::PENGELUARAN, 'adik', 'Bank Anak', 'Kebutuhan Balita', 'Kebutuhan Balita', 210000, '2026-03-05', 'Popok dan tissue bayi', PaymentMethod::TRANSFER, ['Bulanan', 'Anak']),
            self::bulk('ENT-FIN-037', 'ENT-BULK-ANAK-01', 'Pakaian & Vitamin Balita', TransactionType::PENGELUARAN, 'adik', 'Bank Anak', 'Kebutuhan Balita', 'Kebutuhan Balita', 295000, '2026-03-05', 'Vitamin dan baju ganti balita', PaymentMethod::TRANSFER, ['Bulanan', 'Anak']),

            self::single('ENT-FIN-038', 'Uang Saku Harian', TransactionType::PENGELUARAN, 'kakak', 'eWallet Anak', 'Utama', 'Jajan & Mainan', 65000, '2026-04-05', 'Uang saku sekolah harian', PaymentMethod::DOMPET_DIGITAL, ['Harian', 'Anak']),
            self::single('ENT-FIN-039', 'Hiburan Edukatif', TransactionType::PENGELUARAN, 'adik', 'Tunai Anak', 'Utama', 'Jajan & Mainan', 120000, '2026-03-31', 'Mainan edukatif dan buku cerita', PaymentMethod::TUNAI, ['Bulanan', 'Anak']),
            self::single('ENT-FIN-061', 'Hiburan Edukatif', TransactionType::PENGELUARAN, 'kakak', 'Bank Anak', 'Jajan & Mainan', 'Jajan & Mainan', 155000, '2026-04-07', 'Buku aktivitas dan puzzle anak', PaymentMethod::TRANSFER, ['Bulanan', 'Anak']),

            self::single('ENT-FIN-040', 'Stok & Bahan Baku', TransactionType::PENGELUARAN, 'abi', 'Bank Bisnis', 'Operasional Bisnis', 'Operasional Bisnis', 1450000, '2026-04-01', 'Belanja stok servis dan inventaris', PaymentMethod::TRANSFER, ['Bulanan', 'Bisnis']),
            self::single('ENT-FIN-041', 'Legalitas & Sewa Bisnis', TransactionType::PENGELUARAN, 'abi', 'Bank Bisnis', 'Operasional Bisnis', 'Operasional Bisnis', 1650000, '2026-03-15', 'Perpanjangan izin dan sewa tempat', PaymentMethod::TRANSFER, ['Bulanan', 'Bisnis']),
            self::single('ENT-FIN-042', 'Periklanan & Ads', TransactionType::PENGELUARAN, 'abi', 'Bank Bisnis', 'Marketing Bisnis', 'Marketing Bisnis', 650000, '2026-03-28', 'Iklan media sosial bulanan', PaymentMethod::TRANSFER, ['Bulanan', 'Bisnis']),
            self::single('ENT-FIN-043', 'Produksi Konten', TransactionType::PENGELUARAN, 'abi', 'Bank Bisnis', 'Marketing Bisnis', 'Marketing Bisnis', 475000, '2026-03-21', 'Bayar editor konten promosi', PaymentMethod::TRANSFER, ['Bulanan', 'Bisnis']),

            self::single('ENT-FIN-044', 'Perawatan Medis & Obat', TransactionType::PENGELUARAN, 'umma', 'Bank Darurat', 'Kesehatan & Medis', 'Kesehatan & Medis', 365000, '2026-04-02', 'Kontrol dokter dan tebus obat', PaymentMethod::TRANSFER, ['Bulanan', 'Darurat']),
            self::single('ENT-FIN-045', 'Vitamin & Suplemen', TransactionType::PENGELUARAN, 'umma', 'Bank Darurat', 'Kesehatan & Medis', 'Kesehatan & Medis', 195000, '2026-03-23', 'Beli suplemen keluarga', PaymentMethod::TRANSFER, ['Bulanan', 'Darurat']),
            self::single('ENT-FIN-046', 'Pemeliharaan Bangunan', TransactionType::PENGELUARAN, 'umma', 'Bank Darurat', 'Perbaikan Rumah', 'Perbaikan Rumah', 1325000, '2026-03-27', 'Perbaikan atap bocor dan pompa air', PaymentMethod::TRANSFER, ['Bulanan', 'Keluarga']),

            self::transfer('ENT-FIN-047', 'Saldo Ekspansi', 'abi', 'Bank Bisnis', 'Utama', 'Laba Ditahan', 1250000, '2026-04-03', 'Parkir laba untuk ekspansi', 'ENT-TRF-LABA-01', 'out', ['Transfer', 'Bisnis']),
            self::transfer('ENT-FIN-048', 'Saldo Ekspansi', 'abi', 'Bank Bisnis', 'Laba Ditahan', 'Laba Ditahan', 1250000, '2026-04-03', 'Saldo laba masuk ke dana ekspansi', 'ENT-TRF-LABA-01', 'in', ['Transfer', 'Bisnis']),

            self::transfer('ENT-FIN-049', 'Cadangan Keuangan', 'umma', 'Bank Darurat', 'Utama', 'Dana Siaga', 950000, '2026-03-31', 'Sisihkan dana cadangan keluarga', 'ENT-TRF-SIAGA-01', 'out', ['Transfer', 'Darurat']),
            self::transfer('ENT-FIN-050', 'Cadangan Keuangan', 'umma', 'Bank Darurat', 'Dana Siaga', 'Dana Siaga', 950000, '2026-03-31', 'Dana siaga menerima alokasi baru', 'ENT-TRF-SIAGA-01', 'in', ['Transfer', 'Darurat']),

            self::transfer('ENT-FIN-051', 'Investasi Masa Depan', 'umma', 'Bank Darurat', 'Utama', 'Dana Pendidikan Masa Depan', 1100000, '2026-03-29', 'Alokasi dana masa depan anak', 'ENT-TRF-DEPAN-01', 'out', ['Transfer', 'Darurat']),
            self::transfer('ENT-FIN-052', 'Investasi Masa Depan', 'umma', 'Bank Darurat', 'Dana Pendidikan Masa Depan', 'Dana Pendidikan Masa Depan', 1100000, '2026-03-29', 'Dana pendidikan menerima top up', 'ENT-TRF-DEPAN-01', 'in', ['Transfer', 'Darurat']),

            self::transfer('ENT-FIN-053', 'Mutasi Antar Akun', 'abi', 'Bank Abi', 'Utama', 'Tunai Abi', 300000, '2026-04-04', 'Tarik dana ke kas harian', 'ENT-TRF-MUTASI-01', 'out', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-054', 'Mutasi Antar Akun', 'abi', 'Tunai Abi', 'Utama', 'Utama', 300000, '2026-04-04', 'Kas harian menerima transfer', 'ENT-TRF-MUTASI-01', 'in', ['Transfer', 'Personal']),

            self::transfer('ENT-FIN-055', 'Pembayaran Kartu Kredit', 'abi', 'Bank Abi', 'Utama', 'Kredit Abi', 1750000, '2026-03-30', 'Bayar tagihan kartu kredit', 'ENT-TRF-KK-01', 'out', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-056', 'Pembayaran Kartu Kredit', 'abi', 'Kredit Abi', 'Utama', 'Utama', 1750000, '2026-03-30', 'Pelunasan kartu kredit bulan ini', 'ENT-TRF-KK-01', 'in', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-062', 'Pembayaran Kartu Kredit', 'umma', 'Bank Umma', 'Utama', 'Kredit Umma', 450000, '2026-04-10', 'Bayar sebagian kartu kredit Umma', 'ENT-TRF-KK-UM-01', 'out', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-063', 'Pembayaran Kartu Kredit', 'umma', 'Kredit Umma', 'Utama', 'Utama', 450000, '2026-04-10', 'Kartu kredit Umma menerima pembayaran', 'ENT-TRF-KK-UM-01', 'in', ['Transfer', 'Personal']),
            self::transfer('ENT-FIN-064', 'Mutasi Antar Akun', 'kakak', 'Bank Anak', 'Penerimaan Hadiah', 'eWallet Anak', 200000, '2026-04-09', 'Pindah angpao ke ewallet anak', 'ENT-TRF-GIFT-01', 'out', ['Transfer', 'Anak']),
            self::transfer('ENT-FIN-065', 'Mutasi Antar Akun', 'kakak', 'eWallet Anak', 'Utama', 'Utama', 200000, '2026-04-09', 'Ewallet anak menerima angpao', 'ENT-TRF-GIFT-01', 'in', ['Transfer', 'Anak']),
        ];
    }

    private static function single(
        string $reference,
        string $category,
        TransactionType $type,
        string $member,
        string $account,
        string $pocket,
        ?string $budget,
        float $amount,
        string $transactionDate,
        string $description,
        PaymentMethod $paymentMethod,
        array $tags = [],
    ): array {
        return self::transaction(
            reference: $reference,
            category: $category,
            type: $type,
            member: $member,
            account: $account,
            pocket: $pocket,
            budget: $budget,
            amount: $amount,
            transactionDate: $transactionDate,
            description: $description,
            paymentMethod: $paymentMethod,
            tags: $tags,
        );
    }

    private static function bulk(
        string $reference,
        string $sourceId,
        string $category,
        TransactionType $type,
        string $member,
        string $account,
        string $pocket,
        ?string $budget,
        float $amount,
        string $transactionDate,
        string $description,
        PaymentMethod $paymentMethod,
        array $tags = [],
    ): array {
        return self::transaction(
            reference: $reference,
            category: $category,
            type: $type,
            member: $member,
            account: $account,
            pocket: $pocket,
            budget: $budget,
            amount: $amount,
            transactionDate: $transactionDate,
            description: $description,
            paymentMethod: $paymentMethod,
            tags: $tags,
            sourceType: 'finance_bulk',
            sourceId: $sourceId,
        );
    }

    private static function transfer(
        string $reference,
        string $category,
        string $member,
        string $account,
        string $sourcePocket,
        string $targetPocket,
        float $amount,
        string $transactionDate,
        string $description,
        string $transferGroup,
        string $direction,
        array $tags = [],
    ): array {
        return self::transaction(
            reference: $reference,
            category: $category,
            type: TransactionType::TRANSFER,
            member: $member,
            account: $account,
            pocket: $direction === 'in' ? $targetPocket : $sourcePocket,
            budget: null,
            amount: $amount,
            transactionDate: $transactionDate,
            description: $description,
            paymentMethod: PaymentMethod::TRANSFER,
            tags: $tags,
            transferGroup: $transferGroup,
            transferDirection: $direction,
        );
    }

    private static function transaction(
        string $reference,
        string $category,
        TransactionType $type,
        string $member,
        string $account,
        string $pocket,
        ?string $budget,
        float $amount,
        string $transactionDate,
        string $description,
        PaymentMethod $paymentMethod,
        array $tags = [],
        ?string $sourceType = null,
        ?string $sourceId = null,
        ?string $transferGroup = null,
        ?string $transferDirection = null,
    ): array {
        return [
            'reference' => $reference,
            'category' => $category,
            'type' => $type,
            'member' => $member,
            'account' => $account,
            'pocket' => $pocket,
            'budget' => $budget,
            'amount' => $amount,
            'transaction_date' => $transactionDate,
            'description' => $description,
            'payment_method' => $paymentMethod,
            'tags' => $tags,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'transfer_group' => $transferGroup,
            'transfer_direction' => $transferDirection,
        ];
    }
}
