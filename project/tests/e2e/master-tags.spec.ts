import { expect, test } from '@playwright/test';

const targetUrl = '/admin/master/tags';

test.describe('Master Data - Tags Comprehensive Suite', () => {

    test.beforeEach(async ({ page }) => {
        // Since we use storageState, we should be already logged in as admin.
        // We just need to go to the target page.
        await page.goto(targetUrl);
        await page.waitForLoadState('networkidle');
    });

    test.describe('A. Fitur Spesifik Modul & Form', () => {

        test('Validasi Input: Nama tidak boleh kosong', async ({ page }) => {
            await page.locator('[data-testid="add-btn"]').click();
            const modal = page.getByTestId('tag-modal');
            await expect(modal).toBeVisible({ timeout: 15000 });

            // Coba simpan tanpa isi nama
            await page.locator('[data-testid="tag-submit-btn"]').click();

            // Verifikasi browser prevent submit dengan checkValidity (Konsisten dengan master-categories)
            const nameInput = modal.locator('input[required]').first();
            const isValid = await nameInput.evaluate((el: any) => el.checkValidity());
            expect(isValid).toBe(false);

            await page.getByRole('button', { name: /Batal|Cancel/i }).click();
        });

        test('Lengkap CRUD: Simpan, Cari, Edit, dan Hapus', async ({ page }) => {
            const timestamp = Date.now();
            const dummyName = `Tag-${timestamp}`;
            const updatedName = `Updated-${timestamp}`;
            const testColor = '#ff5733';

            // 1. CREATE
            await page.locator('[data-testid="add-btn"]').click();
            await page.locator('[data-testid="tag-name-input"]').fill(dummyName);
            await page.locator('[data-testid="tag-color-input"]').fill(testColor);

            const createResponse = page.waitForResponse(resp =>
                resp.url().includes('/master/tags') && resp.request().method() === 'POST'
            );
            await page.locator('[data-testid="tag-submit-btn"]').click();
            await createResponse;

            // Tunggu toast success (Konsisten dengan master-currencies)
            await expect(page.locator('.toast-success, .Toastify__toast--success').first()).toBeVisible({ timeout: 10000 });

            // 2. SEARCH & VERIFY (Gunakan class form-control-sm konsisten dengan modul lain)
            const nameFilter = page.locator('thead input.form-control-sm').first();
            await nameFilter.fill(dummyName);
            await page.waitForTimeout(2000);

            const row = page.locator('tbody tr').filter({ hasText: dummyName });
            await expect(row).toBeVisible();

            // 3. EDIT
            await row.locator('.dropdown-toggle').click();
            await page.locator('[data-testid="edit-btn"]').click();

            await page.locator('[data-testid="tag-name-input"]').fill(updatedName);

            const updateResponse = page.waitForResponse(resp =>
                resp.url().includes('/master/tags/') && resp.request().method() === 'PATCH'
            );
            await page.locator('[data-testid="tag-submit-btn"]').click();
            await updateResponse;

            await expect(page.locator('.toast-success, .Toastify__toast--success').first()).toBeVisible();

            // Re-filter with updated name
            await nameFilter.fill(updatedName);
            await page.waitForTimeout(2000);
            const updatedRow = page.locator('tbody tr').filter({ hasText: updatedName });
            await expect(updatedRow).toBeVisible();

            // 4. DELETE
            await updatedRow.locator('.dropdown-toggle').click();
            await page.locator('[data-testid="delete-btn"]').click();

            // Gunakan selector modal umum konsisten dengan modul lain
            const confirmBtn = page.locator('.modal.show .btn-danger');
            await expect(confirmBtn).toBeVisible();
            await confirmBtn.click();

            await expect(page.locator('.toast-success, .Toastify__toast--success').first()).toBeVisible();
            await expect(updatedRow).not.toBeVisible();
        });

        test('Validasi Duplikat: Nama tidak boleh kembar', async ({ page }) => {
            const existingName = 'sukses'; // Gunakan yang pasti ada

            await page.locator('[data-testid="add-btn"]').click();
            await page.locator('[data-testid="tag-name-input"]').fill(existingName);
            await page.locator('[data-testid="tag-submit-btn"]').click();

            // Verifikasi Toast Error (Konsisten dengan master-currencies)
            const errorToast = page.locator('.toast-error, .Toastify__toast--error, .alert-danger').first();
            await expect(errorToast).toBeVisible();
            await expect(errorToast).toContainText(/sudah ada|already exists|taken/i);

            await page.getByRole('button', { name: /Batal|Cancel/i }).click();
        });
    });

    test.describe('B. Interaksi Tabel & Statistik', () => {

        test('Pencarian: Filter nama dan pesan "No results"', async ({ page }) => {
            const nameFilter = page.locator('thead input.form-control-sm').first();
            await nameFilter.fill('ZXY_NON_EXISTENT_TAG_999');
            await page.waitForTimeout(2000);
            await expect(page.locator('tbody tr').filter({ hasText: /Maaf|Sorry|Tidak ada hasil|No result/i })).toBeVisible();
        });

        test('Warna: Sinkronisasi tampilan di tabel', async ({ page }) => {
            const testName = `ColorTag-${Date.now()}`;
            const testColor = '#123456';

            await page.locator('[data-testid="add-btn"]').click();
            await page.locator('[data-testid="tag-name-input"]').fill(testName);
            await page.locator('[data-testid="tag-color-input"]').fill(testColor);
            await page.locator('[data-testid="tag-submit-btn"]').click();

            const nameFilter = page.locator('thead input.form-control-sm').first();
            await nameFilter.fill(testName);
            await page.waitForTimeout(2000);

            const badge = page.locator('tbody tr').filter({ hasText: testName }).locator('.badge');
            await expect(badge).toHaveAttribute('style', /background-color:\s*(rgb\(18, 52, 86\)|#123456)/i);

            // Cleanup
            const row = page.locator('tbody tr').filter({ hasText: testName });
            await row.locator('.dropdown-toggle').click();
            await page.locator('[data-testid="delete-btn"]').click();
            await page.locator('.modal.show .btn-danger').click();
        });
    });

    test.describe('C. Keamanan & Batasan (Edge Cases)', () => {

        test('Transaction Protection: Tidak bisa menghapus tag yang ada transaksi', async ({ page }) => {
            const protectedName = 'sukses';
            const nameFilter = page.locator('thead input.form-control-sm').first();
            await nameFilter.fill(protectedName);
            await page.waitForTimeout(2000);

            const row = page.locator('tr').filter({ hasText: protectedName });
            if (await row.isVisible()) {
                await row.locator('.dropdown-toggle').click();
                await page.locator('[data-testid="delete-btn"]').click();
                await page.locator('.modal.show .btn-danger').click();

                // Verifikasi Toast Error (Konsisten dengan master-categories)
                const toast = page.locator('.toast-error, [role="alert"]');
                await expect(toast).toBeVisible({ timeout: 10000 });
                await expect(toast).toContainText(/digunakan|used/i);

                await page.keyboard.press('Escape');
            }
        });

        test('Bulk Delete Safety: Menghapus banyak sekaligus dengan proteksi transaksi', async ({ page }) => {
            // ALUR MENGIKUTI master-categories.spec.ts
            const dummyName = `BulkTag-${Date.now()}`;

            // 1. Buat Dummy Baru
            await page.locator('[data-testid="add-btn"]').click();
            await page.locator('[data-testid="tag-name-input"]').fill(dummyName);
            await page.locator('[data-testid="tag-submit-btn"]').click();
            await page.waitForTimeout(2000);

            const nameFilter = page.locator('thead input.form-control-sm').first();
            // Bersihkan filter agar semua target terlihat
            await nameFilter.fill('');
            await page.waitForTimeout(2000);

            // 2. Pilih Tag Baru (Aman dihapus)
            await page.locator('tr').filter({ hasText: dummyName }).locator('input[type="checkbox"]').check();

            // 3. Pilih Tag "sukses" (Gagal karena transaksi)
            await page.locator('tr').filter({ hasText: 'sukses' }).locator('input[type="checkbox"]').check();

            // 4. Klik Hapus Terpilih (Tombol muncul karena > 1 terpilih)
            const bulkBtn = page.locator('[data-testid="bulk-delete-btn"]');
            await expect(bulkBtn).toBeVisible();
            await bulkBtn.click();

            await page.locator('.modal.show .btn-danger').click();

            // 5. Harus muncul error report (Toast) karena ada yang gagal (Partial Success)
            const toast = page.locator('.toast-error, [role="alert"]');
            await expect(toast).toBeVisible({ timeout: 15000 });
            await expect(toast).toContainText(/gagal|failed/i);
            await expect(toast).toContainText('sukses');

            // 6. Dummy harusnya TELAH terhapus, 'sukses' TETAP ada
            await nameFilter.fill(dummyName);
            await page.waitForTimeout(1000);
            await expect(page.locator('tbody tr').filter({ hasText: dummyName })).not.toBeVisible();

            await nameFilter.fill('sukses');
            await page.waitForTimeout(1000);
            await expect(page.locator('tbody tr').filter({ hasText: 'sukses' })).toBeVisible();
        });
    });

});
