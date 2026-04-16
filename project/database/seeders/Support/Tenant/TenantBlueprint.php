<?php

namespace Database\Seeders\Support\Tenant;

class TenantBlueprint
{
    public static function all(): array
    {
        return [
            'free' => [
                'name' => 'Free',
                'slug' => 'free',
                'plan_code' => 'free',
                'members' => [
                    ['key' => 'owner', 'name' => 'Owner', 'role' => 'owner'],
                ],
            ],
            'pro' => [
                'name' => 'Pro',
                'slug' => 'pro',
                'plan_code' => 'pro',
                'members' => [
                    ['key' => 'owner', 'name' => 'Owner', 'role' => 'owner'],
                ],
            ],
            'business' => [
                'name' => 'Business',
                'slug' => 'business',
                'plan_code' => 'business',
                'members' => [
                    ['key' => 'owner', 'name' => 'Owner', 'role' => 'owner'],
                ],
            ],
            'enterprise' => [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'plan_code' => 'enterprise',
                'members' => [
                    ['key' => 'owner', 'name' => 'Owner', 'role' => 'owner'],
                    ['key' => 'umma', 'name' => 'Umma', 'role' => 'member'],
                    ['key' => 'abi', 'name' => 'Abi', 'role' => 'member'],
                    ['key' => 'kakak', 'name' => 'Kakak', 'role' => 'member'],
                    ['key' => 'adik', 'name' => 'Adik', 'role' => 'member'],
                ],
            ],
        ];
    }
}
