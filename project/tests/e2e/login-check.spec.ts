import { test } from '@playwright/test';

test('simple login check', async ({ page }) => {
    await page.goto('https://enterprise.sanjo.my.id/admin/login');
    await page.getByLabel(/Email/i).fill('owner@enterprise.com');
    await page.getByLabel(/Password/i).fill('password');
    await page.getByRole('button', { name: /Sign In|Masuk|Login/i }).click();

    // Wait for the dashboard or an error
    try {
        await page.waitForURL('**/admin/dashboard**', { timeout: 10000 });
        console.log('Login successful');
    } catch (e) {
        console.log('Login failed');
        await page.screenshot({ path: 'login-failure.png' });
        throw e;
    }
});
