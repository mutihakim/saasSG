<?php

namespace Database\Factories\Tenant;

use App\Models\Tenant\Tenant;
use App\Models\Identity\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tenant\Tenant>
 */
class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    public function definition(): array
    {
        $name = $this->faker->company();
        return [
            'owner_user_id' => User::factory(),
            'name' => $name,
            'slug' => \Illuminate\Support\Str::slug($name),
            'locale' => 'id',
            'timezone' => 'Asia/Jakarta',
            'plan_code' => 'free',
            'status' => 'active',
        ];
    }
}
