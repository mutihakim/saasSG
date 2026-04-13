<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissionNames = [
            'games.vocabulary.view',
            'games.vocabulary.create',
            'games.vocabulary.update',
        ];

        $permissionIds = [];
        foreach ($permissionNames as $name) {
            $permissionId = DB::table('permissions')->where('name', $name)->value('id');

            if (!$permissionId) {
                $permissionId = DB::table('permissions')->insertGetId([
                    'name' => $name,
                    'guard_name' => 'web',
                    'created_at' => now()->utc(),
                    'updated_at' => now()->utc(),
                ]);
            }

            $permissionIds[$name] = (int) $permissionId;
        }

        $roles = DB::table('roles')
            ->whereIn('name', ['owner', 'admin', 'member'])
            ->get(['id']);

        foreach ($roles as $role) {
            foreach ($permissionIds as $permissionId) {
                $exists = DB::table('role_has_permissions')
                    ->where('permission_id', $permissionId)
                    ->where('role_id', $role->id)
                    ->exists();

                if (!$exists) {
                    DB::table('role_has_permissions')->insert([
                        'permission_id' => $permissionId,
                        'role_id' => $role->id,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        $permissionNames = [
            'games.vocabulary.view',
            'games.vocabulary.create',
            'games.vocabulary.update',
        ];

        $permissionIds = DB::table('permissions')
            ->whereIn('name', $permissionNames)
            ->pluck('id')
            ->all();

        if (!empty($permissionIds)) {
            DB::table('role_has_permissions')
                ->whereIn('permission_id', $permissionIds)
                ->delete();

            DB::table('permissions')
                ->whereIn('id', $permissionIds)
                ->delete();
        }
    }
};
