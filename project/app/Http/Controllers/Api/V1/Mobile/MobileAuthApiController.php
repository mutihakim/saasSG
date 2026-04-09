<?php

namespace App\Http\Controllers\Api\V1\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantMember;
use App\Models\User;
use App\Services\TwoFactorAuthService;
use App\Support\ApiResponder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MobileAuthApiController extends Controller
{
    use ApiResponder;

    public function login(Request $request)
    {
        $payload = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'otp_code' => ['nullable', 'string', 'max:20'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ]);

        $throttleKey = Str::transliterate(Str::lower($payload['email']).'|'.$request->ip());
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return $this->error('VALIDATION_ERROR', trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]), [
                'field' => 'email',
                'seconds' => $seconds,
            ], 422);
        }

        /** @var User|null $user */
        $user = User::query()->where('email', Str::lower($payload['email']))->first();

        if (! $user || ! Hash::check($payload['password'], $user->password)) {
            RateLimiter::hit($throttleKey);

            return $this->error('VALIDATION_ERROR', trans('auth.failed'), [
                'field' => 'email',
            ], 422);
        }

        if ($user->two_factor_confirmed_at) {
            $code = trim((string) ($payload['otp_code'] ?? ''));
            if ($code === '') {
                RateLimiter::hit($throttleKey);

                return $this->error('VALIDATION_ERROR', 'Authenticator code is required.', [
                    'field' => 'otp_code',
                ], 422);
            }

            $twoFactor = app(TwoFactorAuthService::class);
            if (! $twoFactor->verifyCode($user, $code)) {
                RateLimiter::hit($throttleKey);

                return $this->error('VALIDATION_ERROR', 'Invalid authenticator or recovery code.', [
                    'field' => 'otp_code',
                ], 422);
            }
        }

        RateLimiter::clear($throttleKey);

        $tokenName = trim((string) ($payload['device_name'] ?? 'mobile-app'));
        $plainTextToken = $user->createToken($tokenName)->plainTextToken;

        return $this->ok([
            'token' => $plainTextToken,
            'token_type' => 'Bearer',
            'user' => $this->formatUser($user),
            'memberships_count' => TenantMember::query()
                ->where('user_id', $user->id)
                ->where('profile_status', 'active')
                ->whereNull('deleted_at')
                ->count(),
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->user()?->currentAccessToken();
        if ($token) {
            $token->delete();
        }

        return $this->ok();
    }

    public function me(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        return $this->ok([
            'user' => $this->formatUser($user),
        ]);
    }

    public function tenants(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        $memberships = TenantMember::query()
            ->with('tenant')
            ->where('user_id', $user->id)
            ->where('profile_status', 'active')
            ->whereNull('deleted_at')
            ->get()
            ->filter(fn (TenantMember $member) => $member->tenant !== null)
            ->map(function (TenantMember $member) {
                /** @var Tenant $tenant */
                $tenant = $member->tenant;

                return [
                    'tenant' => [
                        'id' => $tenant->id,
                        'slug' => $tenant->slug,
                        'name' => $tenant->presentableName(),
                        'status' => $tenant->status,
                        'locale' => $tenant->locale,
                        'timezone' => $tenant->timezone,
                        'currency_code' => $tenant->currency_code,
                        'plan_code' => $tenant->plan_code,
                    ],
                    'member' => [
                        'id' => $member->id,
                        'full_name' => $member->full_name,
                        'role_code' => $member->role_code,
                        'profile_status' => $member->profile_status,
                    ],
                ];
            })
            ->values();

        return $this->ok([
            'tenants' => $memberships,
        ]);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_url' => $user->avatar_url,
            'is_superadmin' => (bool) $user->is_superadmin,
            'two_factor_enabled' => $user->two_factor_confirmed_at !== null,
        ];
    }
}
