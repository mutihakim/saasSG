<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Relations\Relation;

return new class extends Migration
{
    private array $map = [
        'user' => \App\Models\User::class,
        'tenant' => \App\Models\Tenant::class,
        'tenant_member' => \App\Models\TenantMember::class,
        'social_account' => \App\Models\SocialAccount::class,
        'finance_transaction' => \App\Models\FinanceTransaction::class,
        'finance_wallet' => \App\Models\FinanceWallet::class,
        'finance_savings_goal' => \App\Models\FinanceSavingsGoal::class,
        'finance_pocket' => \App\Models\FinancePocket::class,
        'finance_month_review' => \App\Models\FinanceMonthReview::class,
        'wallet_wish' => \App\Models\WalletWish::class,
        'tenant_budget' => \App\Models\TenantBudget::class,
        'tenant_budget_line' => \App\Models\TenantBudgetLine::class,
        'tenant_category' => \App\Models\TenantCategory::class,
        'tenant_currency' => \App\Models\TenantCurrency::class,
        'tenant_tag' => \App\Models\TenantTag::class,
        'tenant_uom' => \App\Models\TenantUom::class,
        'tenant_bank_account' => \App\Models\TenantBankAccount::class,
        'tenant_whatsapp_message' => \App\Models\TenantWhatsappMessage::class,
        'tenant_whatsapp_contact' => \App\Models\TenantWhatsappContact::class,
        'tenant_whatsapp_setting' => \App\Models\TenantWhatsappSetting::class,
        'tenant_whatsapp_notification' => \App\Models\TenantWhatsappNotification::class,
        'tenant_attachment' => \App\Models\TenantAttachment::class,
        'tenant_invitation' => \App\Models\TenantInvitation::class,
        'tenant_recurring_rule' => \App\Models\TenantRecurringRule::class,
        'activity_log' => \App\Models\ActivityLog::class,
    ];

    public function up(): void
    {
        foreach ($this->map as $alias => $class) {
            $this->updateMorphType($class, $alias);
        }
    }

    public function down(): void
    {
        foreach ($this->map as $alias => $class) {
            $this->updateMorphType($alias, $class);
        }
    }

    private function updateMorphType(string $from, string $to): void
    {
        // Spatie Permission
        DB::table('model_has_roles')->where('model_type', $from)->update(['model_type' => $to]);
        DB::table('model_has_permissions')->where('model_type', $from)->update(['model_type' => $to]);

        // Attachments
        if (Schema::hasTable('tenant_attachments')) {
            DB::table('tenant_attachments')->where('attachable_type', $from)->update(['attachable_type' => $to]);
        }

        // Taggables
        if (Schema::hasTable('tenant_taggables')) {
            DB::table('tenant_taggables')->where('taggable_type', $from)->update(['taggable_type' => $to]);
        }

        // Activity Log
        if (Schema::hasTable('activity_log')) {
            DB::table('activity_log')->where('subject_type', $from)->update(['subject_type' => $to]);
            DB::table('activity_log')->where('causer_type', $from)->update(['causer_type' => $to]);
        }

        // Recurring Rules
        if (Schema::hasTable('tenant_recurring_rules')) {
            DB::table('tenant_recurring_rules')->where('ruleable_type', $from)->update(['ruleable_type' => $to]);
        }
    }
};
