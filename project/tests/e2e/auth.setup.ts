import { test as setup, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const authFile = join(__dirname, '../../playwright/.auth/user.json');

setup('authenticate as admin', async ({ page }) => {
    // Navigate to admin login
    await page.goto('/admin/login');
    
    // Fill credentials
    // We use the same credentials as before, but here in a setup block
    await page.getByLabel(/Email/i).fill('owner@enterprise.com');
    await page.getByLabel(/Password/i).fill('password');
    await page.getByRole('button', { name: /Sign In|Masuk|Login/i }).click();

    // Wait for successful login (redirect to dashboard)
    await page.waitForURL('**/admin/dashboard**', { timeout: 15000 });
    
    // Verify dashboard renders to be sure we are logged in
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();

    // End of authentication
    await page.context().storageState({ path: authFile });
});
