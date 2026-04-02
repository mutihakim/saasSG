<?php

namespace Database\Factories;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tenant>
 */
class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    public function definition(): array
    {
        $name = $this->faker->company();
        return [
            'owner_user_id' => \App\Models\User::factory(),
            'name' => $name,
            'slug' => \Illuminate\Support\Str::slug($name),
            'locale' => 'id',
            'timezone' => 'Asia/Jakarta',
            'plan_code' => 'free',
            'status' => 'active',
        ];
    }
}
