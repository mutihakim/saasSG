<?php

namespace App\Services\Games\Curriculum;

use App\Models\Games\TenantGameCurriculumSetting;
use App\Models\Tenant\Tenant;
use App\Models\Tenant\TenantMember;

class CurriculumSettingService
{
    public const DEFAULT_GRADE = 1;
    public const DEFAULT_MODE = 'practice';
    public const DEFAULT_QUESTION_COUNT = 6;
    public const DEFAULT_TIME_LIMIT = 8;
    public const DEFAULT_MASTERED_THRESHOLD = 8;

    public function settings(Tenant $tenant, TenantMember $member): array
    {
        $setting = TenantGameCurriculumSetting::query()
            ->where('tenant_id', $tenant->id)
            ->where('member_id', $member->id)
            ->first();

        if (!$setting) {
            return [
                'grade' => self::DEFAULT_GRADE,
                'default_mode' => self::DEFAULT_MODE,
                'default_question_count' => self::DEFAULT_QUESTION_COUNT,
                'default_time_limit' => self::DEFAULT_TIME_LIMIT,
                'mastered_threshold' => self::DEFAULT_MASTERED_THRESHOLD,
            ];
        }

        return [
            'grade' => (int) $setting->grade,
            'default_mode' => (string) $setting->default_mode,
            'default_question_count' => (int) $setting->default_question_count,
            'default_time_limit' => (int) $setting->default_time_limit,
            'mastered_threshold' => (int) $setting->mastered_threshold,
        ];
    }

    public function updateSettings(Tenant $tenant, TenantMember $member, array $data): void
    {
        TenantGameCurriculumSetting::query()->updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'member_id' => $member->id,
            ],
            [
                'grade' => $data['grade'],
                'default_mode' => $data['default_mode'],
                'default_question_count' => $data['default_question_count'],
                'default_time_limit' => $data['default_time_limit'],
                'mastered_threshold' => $data['mastered_threshold'],
            ]
        );
    }
}
