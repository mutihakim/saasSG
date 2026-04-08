<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('finance_pockets', function (Blueprint $table) {
            $table->boolean('is_system')->default(false)->after('type');
        });

        Schema::create('finance_savings_goals', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->ulid('pocket_id');
            $table->foreignId('owner_member_id')->nullable()->constrained('tenant_members')->nullOnDelete();
            $table->string('name', 120);
            $table->decimal('target_amount', 15, 2);
            $table->decimal('current_amount', 15, 2)->default(0);
            $table->date('target_date')->nullable();
            $table->string('status', 20)->default('active');
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('row_version')->default(1);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('pocket_id')->references('id')->on('finance_pockets')->cascadeOnDelete();
            $table->index(['tenant_id', 'pocket_id']);
            $table->index(['tenant_id', 'owner_member_id']);
        });

        $accounts = DB::table('tenant_bank_accounts')
            ->select(['id', 'tenant_id', 'owner_member_id', 'name', 'scope', 'currency_code', 'current_balance', 'is_active'])
            ->orderBy('tenant_id')
            ->orderBy('id')
            ->get();

        foreach ($accounts as $account) {
            $mainPocket = DB::table('finance_pockets')
                ->where('tenant_id', $account->tenant_id)
                ->where('real_account_id', $account->id)
                ->where('is_system', true)
                ->first();

            if (! $mainPocket) {
                DB::table('finance_pockets')->insert([
                    'id' => (string) Str::ulid(),
                    'tenant_id' => $account->tenant_id,
                    'real_account_id' => $account->id,
                    'owner_member_id' => $account->owner_member_id,
                    'name' => $account->name . ' Main',
                    'slug' => Str::slug($account->name . ' main'),
                    'type' => 'main',
                    'is_system' => true,
                    'scope' => $account->scope,
                    'currency_code' => $account->currency_code,
                    'reference_code' => 'PKT-' . strtoupper(Str::random(8)),
                    'icon_key' => 'ri-safe-line',
                    'target_amount' => null,
                    'current_balance' => $account->current_balance ?? 0,
                    'notes' => 'Pocket sistem utama untuk account ini.',
                    'is_active' => $account->is_active ?? true,
                    'row_version' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $mainPocket = DB::table('finance_pockets')
                    ->where('tenant_id', $account->tenant_id)
                    ->where('real_account_id', $account->id)
                    ->where('is_system', true)
                    ->first();
            }

            if ($mainPocket) {
                DB::table('finance_transactions')
                    ->where('tenant_id', $account->tenant_id)
                    ->where('bank_account_id', $account->id)
                    ->whereNull('pocket_id')
                    ->update(['pocket_id' => $mainPocket->id]);
            }
        }

        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE finance_transactions ALTER COLUMN pocket_id SET NOT NULL');
        } elseif ($driver === 'mysql') {
            DB::statement('ALTER TABLE finance_transactions MODIFY pocket_id CHAR(26) NOT NULL');
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE finance_transactions ALTER COLUMN pocket_id DROP NOT NULL');
        } elseif ($driver === 'mysql') {
            DB::statement('ALTER TABLE finance_transactions MODIFY pocket_id CHAR(26) NULL');
        }

        Schema::dropIfExists('finance_savings_goals');

        Schema::table('finance_pockets', function (Blueprint $table) {
            $table->dropColumn('is_system');
        });
    }
};
