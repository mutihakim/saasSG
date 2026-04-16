<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;
    use \Illuminate\Foundation\Testing\DatabaseTransactions;

    protected $seed = false;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Ensure Spatie Permission memory cache is cleared before each test
        // This prevents foreign key constraint issues when tests rollback via DatabaseTransactions
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
