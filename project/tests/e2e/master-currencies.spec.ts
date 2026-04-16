import { expect, test } from '@playwright/test';

const targetUrl = '/admin/master/currencies';

test.describe('Master Data - Currencies Comprehensive Suite', () => {

    test.beforeEach(async ({ page }) => {
        // Since we use storageState, we should be already logged in as admin.
        // We just need to go to the target page.
        await page.goto(targetUrl);
        await page.waitForLoadState('networkidle');
    });

    test.describe('A. Fitur Spesifik Modul & Form', () => {

        test('Validasi Input: Kode tidak boleh kosong', async ({ page }) => {
            await page.locator('[data-testid="add-btn"]').click();
            const modal = page.locator('.modal-content:visible');
            await expect(modal).toBeVisible({ timeout: 15000 });

            // Coba simpan tanpa isi kode
            await page.getByTestId('currency-submit-btn').click();

            // Verifikasi browser prevent submit dengan checkValidity
            const codeInput = page.getByTestId('currency-code-input');
            const isValid = await codeInput.evaluate((el: any) => el.checkValidity());
            expect(isValid).toBe(false);

            await page.getByRole('button', { name: /Batal|Cancel/i }).click();
        });

        test('Lengkap CRUD: Simpan, Cari, Edit, dan Hapus', async ({ page }) => {
            const timestamp = Date.now();
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let dummyCode = '';
            for (let i = 0; i < 3; i++) {
                dummyCode += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            const dummyName = `Currency ${timestamp}`;
            const dummySymbol = `S${Math.floor(Math.random() * 9 + 1)}`;

            // 1. CREATE
            await page.locator('[data-testid="add-btn"]').click();
            await page.getByTestId('currency-code-input').fill(dummyCode);
            await page.getByTestId('currency-name-input').fill(dummyName);
            await page.getByTestId('currency-symbol-input').fill(dummySymbol);

            // Tunggu response POST
            const createResponse = page.waitForResponse(resp =>
                resp.url().includes('/master/currencies') && resp.request().method() === 'POST'
            );
            await page.getByTestId('currency-submit-btn').click();
            await createResponse;

            // Tunggu toast success muncul
            await expect(page.locator('.toast-success, .Toastify__toast--success').first()).toBeVisible({ timeout: 10000 });

            // 2. SEARCH & VERIFY
            const codeFilter = page.locator('thead input.form-control-sm').first();
            await codeFilter.fill(dummyCode);
            await page.waitForTimeout(1000); // Tunggu debounce

            const row = page.locator('tbody tr').filter({ hasText: dummyCode });
            await expect(row).toBeVisible();
            await expect(row).toContainText(dummyName);

            // 3. EDIT (ALL FIELDS)
            const updatedTimestamp = Date.now() + 1;
            let updatedCode = '';
            for (let i = 0; i < 3; i++) {
                updatedCode += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            const updatedName = `Updated ${updatedTimestamp}`;
            const updatedSymbol = `U${Math.floor(Math.random() * 9 + 1)}`;

            await row.locator('.dropdown-toggle').click();
            await page.getByTestId('edit-btn').click();

            await page.getByTestId('currency-code-input').fill(updatedCode);
            await page.getByTestId('currency-name-input').fill(updatedName);
            await page.getByTestId('currency-symbol-input').fill(updatedSymbol);
            await page.locator('#position-after').check(); // Change position to After
            await page.getByTestId('currency-decimal-input').fill('0');
            await page.getByTestId('currency-sort-order-input').fill('99');

            // Tunggu response PATCH
            const updateResponse = page.waitForResponse(resp =>
                resp.url().includes('/master/currencies/') && resp.request().method() === 'PATCH'
            );
            await page.getByTestId('currency-submit-btn').click();
            await updateResponse;

            await expect(page.locator('.toast-success, .Toastify__toast--success').first()).toBeVisible();

            // Re-filter with updated code to verify
            await codeFilter.fill(updatedCode);
            await page.waitForTimeout(1000);
            const updatedRow = page.locator('tbody tr').filter({ hasText: updatedCode });
            await expect(updatedRow).toContainText(updatedName);
            await expect(updatedRow).toContainText(updatedSymbol);
            await expect(updatedRow).toContainText(/after|sesudah/i);

            // 4. DELETE
            await updatedRow.locator('.dropdown-toggle').click();
            await page.getByTestId('delete-btn').click();

            const confirmBtn = page.locator('.modal.show .btn-danger');
            await expect(confirmBtn).toBeVisible();
            await confirmBtn.click();

            await expect(page.locator('.toast-success, .Toastify__toast--success').first()).toBeVisible();
            await expect(updatedRow).not.toBeVisible();
        });

        test('Validasi Duplikat: Kode tidak boleh kembar', async ({ page }) => {
            const existingCode = 'IDR'; // Pastikan IDR ada sebagai default

            // Scenario 1: Add Duplicate
            await page.locator('[data-testid="add-btn"]').click();
            await page.getByTestId('currency-code-input').fill(existingCode);
            await page.getByTestId('currency-name-input').fill('Duplicate IDR');
            await page.getByTestId('currency-symbol-input').fill('Rp');
            await page.getByTestId('currency-submit-btn').click();

            // Verifikasi Toast Error / Alert di Modal
            const errorToast = page.locator('.toast-error, .Toastify__toast--error, .alert-danger').first();
            await expect(errorToast).toBeVisible();
            await expect(errorToast).toContainText(/sudah ada|already exists|taken/i);

            await page.getByRole('button', { name: /Batal|Cancel/i }).click();

            // Scenario 2: Edit to Duplicate
            // 1. Buat dulu mata uang baru yang unik
            const timestamp = Date.now().toString().slice(-3);
            const dummyCode = `Z${timestamp}`.slice(0, 3);

            await page.locator('[data-testid="add-btn"]').click();
            await page.getByTestId('currency-code-input').fill(dummyCode);
            await page.getByTestId('currency-name-input').fill('Test Duplicate');
            await page.getByTestId('currency-symbol-input').fill('A');
            await page.getByTestId('currency-submit-btn').click();
            await page.waitForTimeout(1000);

            // 2. Edit dummy tersebut menjadi 'IDR'
            const row = page.locator('tbody tr').filter({ hasText: dummyCode });
            await row.locator('.dropdown-toggle').click();
            await page.getByTestId('edit-btn').click();

            await page.getByTestId('currency-code-input').fill(existingCode);
            await page.getByTestId('currency-submit-btn').click();

            await expect(errorToast).toBeVisible();
            await expect(errorToast).toContainText(/sudah ada|already exists|taken/i);

            await page.getByRole('button', { name: /Batal|Cancel/i }).click();

            // Cleanup
            await row.locator('.dropdown-toggle').click();
            await page.getByTestId('delete-btn').click();
            await page.locator('.modal.show .btn-danger').click();
        });
    });

    test.describe('B. Interaksi Tabel & Filter', () => {

        test('Pencarian: Filter Kode, Nama, dan Simbol', async ({ page }) => {
            const filters = page.locator('thead input.form-control-sm');

            // Filter by Code
            await filters.nth(0).fill('USD');
            await page.waitForTimeout(1000);
            await expect(page.locator('tbody')).toContainText('USD');
            await expect(page.locator('tbody')).not.toContainText('IDR');

            // Filter by Name
            await filters.nth(0).fill('');
            await filters.nth(1).fill('Rupiah');
            await page.waitForTimeout(1000);
            await expect(page.locator('tbody')).toContainText('IDR');
            await expect(page.locator('tbody')).not.toContainText('USD');

            // No Result Scenario
            await filters.nth(1).fill('NON_EXISTENT_CURRENCY_XYZ');
            await page.waitForTimeout(1000);
            await expect(page.locator('tbody')).toContainText(/tidak ada|no result/i);
        });

        test('Toggle Active: Ubah status ke Nonaktif', async ({ page }) => {
            const timestamp = Date.now().toString().slice(-2);
            const dummyCode = `T${timestamp}`;

            // 1. Create Active
            await page.locator('[data-testid="add-btn"]').click();
            await page.getByTestId('currency-code-input').fill(dummyCode);
            await page.getByTestId('currency-name-input').fill('Temporary Off');
            await page.getByTestId('currency-symbol-input').fill('O');
            await page.getByTestId('currency-submit-btn').click();
            await page.waitForTimeout(1000);

            const row = page.locator('tbody tr').filter({ hasText: dummyCode });

            // 2. Edit to Inactive
            await row.locator('.dropdown-toggle').click();
            await page.getByTestId('edit-btn').click();
            await page.locator('#is_active').uncheck();
            await page.getByTestId('currency-submit-btn').click();

            await expect(row).toContainText(/Nonaktif|Inactive/i);

            // Cleanup
            await row.locator('.dropdown-toggle').click();
            await page.getByTestId('delete-btn').click();
            await page.locator('.modal.show .btn-danger').click();
        });
    });

    test.describe('C. Keamanan & Batasan (Edge Cases)', () => {

        test('System Currency: Proteksi penghapusan', async ({ page }) => {
            // Cari Baris IDR (System)
            const row = page.locator('tr').filter({ hasText: 'IDR' });
            await row.locator('.dropdown-toggle').click();
            await page.getByTestId('delete-btn').click();

            // Klik konfirmasi di modal DeleteModal
            const confirmBtn = page.locator('.modal.show .btn-danger');
            await expect(confirmBtn).toBeVisible();
            await confirmBtn.click();

            // Verifikasi Toast Error (Proteksi Sistem)
            const toast = page.locator('.toast-error, .Toastify__toast--error').first();
            await expect(toast).toBeVisible({ timeout: 10000 });
            await expect(toast).toContainText(/utama sistem|system base/i);
        });

        test('Bulk Delete Safety: Laporan sukses parsial', async ({ page }) => {
            const timestamp = Date.now().toString().slice(-2);
            const dummyCode = `B${timestamp}`;
            const dummyName = `Bulk Dummy ${timestamp}`;

            // 1. Buat dummy dulu agar ada yang bisa dihapus
            await page.locator('[data-testid="add-btn"]').click();
            await page.getByTestId('currency-code-input').fill(dummyCode);
            await page.getByTestId('currency-name-input').fill(dummyName);
            await page.getByTestId('currency-symbol-input').fill('B');
            await page.getByTestId('currency-submit-btn').click();
            await page.waitForTimeout(1000);

            // Pastikan modal tambah tertutup
            await expect(page.locator('.modal-content:visible')).not.toBeVisible();

            // Filter agar keduanya muncul atau pastikan IDR ada
            await page.locator('thead input.form-control-sm').first().fill('');
            await page.waitForTimeout(500);

            // 1. Pilih IDR (Proteksi)
            const rowIdr = page.locator('tr').filter({ hasText: 'IDR' });
            await rowIdr.locator('input[type="checkbox"]').check();

            // 2. Pilih Dummy (Aman)
            const rowDummy = page.locator('tr').filter({ hasText: dummyName });
            await rowDummy.locator('input[type="checkbox"]').check();

            // Tombol hapus massal muncul
            const bulkBtn = page.getByTestId('bulk-delete-btn');
            await expect(bulkBtn).toBeVisible();
            await bulkBtn.click();

            // Tunggu response DELETE
            const bulkResponse = page.waitForResponse(resp =>
                resp.url().includes('/master/currencies') && resp.request().method() === 'DELETE'
            );

            // Konfirmasi di Modal
            const confirmBtn = page.locator('.modal.show .btn-danger');
            await expect(confirmBtn).toBeVisible();
            await confirmBtn.click();

            await bulkResponse;

            // Verifikasi laporan kegagalan mendetail
            const toast = page.locator('.toast-error, .Toastify__toast--error').first();
            await expect(toast).toBeVisible({ timeout: 15000 });
            await expect(toast).toContainText(/gagal dihapus|failed to delete/i);
            await expect(toast).toContainText(/IDR|Rupiah/i);

            // Verifikasi Dummy hilang
            await page.reload();
            await expect(page.locator('tbody')).not.toContainText(dummyName);
        });
    });
});
