import { expect, test } from '@playwright/test';

const targetUrl = '/admin/master/categories';

test.describe('Master Data - Categories Comprehensive Suite', () => {

    test.beforeEach(async ({ page }) => {
        // Since we use storageState, we should be already logged in as admin.
        // We just need to go to the target page.
        await page.goto(targetUrl);
        await page.waitForLoadState('networkidle');
    });

    test.describe('A. Fitur Spesifik Modul & Form', () => {

        test('Validasi Input: Nama tidak boleh kosong', async ({ page }) => {
            await page.locator('[data-testid="add-btn"]').click();
            const modal = page.getByTestId('category-modal');
            await expect(modal).toBeVisible({ timeout: 15000 });

            // Coba simpan tanpa isi nama
            await page.locator('[data-testid="category-submit-btn"]').click();

            // Verifikasi browser prevent submit dengan checkValidity
            const nameInput = modal.locator('input[required]').first();
            const isValid = await nameInput.evaluate((el: any) => el.checkValidity());
            expect(isValid).toBe(false);

            await page.getByRole('button', { name: /Batal|Cancel/i }).click();
        });

        test('Sub-tipe: Memastikan tipe Pemasukan/Pengeluaran tersimpan di Finance', async ({ page }) => {
            const testName = `Finance Cat ${Date.now()}`;
            await page.locator('[data-testid="add-btn"]').click();
            const modal = page.getByTestId('category-modal');
            await expect(modal).toBeVisible({ timeout: 15000 });

            // 1. Isi Nama
            await page.locator('[data-testid="category-name-input"]').fill(testName);

            // 2. Pilih module "finance" (Keuangan) terlibih dahulu agar dropdown tipe muncul
            const moduleSelect = modal.locator('#category-module');
            await moduleSelect.selectOption('finance');
            await expect(moduleSelect).toHaveValue('finance');

            // 3. Sekarang pilih sub-tipe (Pemasukan/Pengeluaran)
            const subTypeSelect = modal.locator('#category-sub-type');
            await expect(subTypeSelect).toBeVisible();
            await subTypeSelect.selectOption('pemasukan');
            await expect(subTypeSelect).toHaveValue('pemasukan');

            // Tunggu response post/patch
            const responsePromise = page.waitForResponse(response =>
                (response.url().includes('/master/categories') || response.url().includes('/categories')) &&
                (response.request().method().toUpperCase() === 'POST' || response.request().method().toUpperCase() === 'PATCH')
            );

            await page.locator('[data-testid="category-submit-btn"]').click();
            await responsePromise;
            await expect(modal).not.toBeVisible();

            // Verifikasi simpel di tabel (Gunakan class form-control-sm untuk filter table)
            const nameFilter = page.locator('thead input.form-control-sm').first();
            await nameFilter.fill(testName);
            await page.waitForTimeout(2000);

            const row = page.locator('tbody tr').filter({ hasText: testName });
            await expect(row).toBeVisible({ timeout: 15000 });
            await expect(row).toContainText(/Pemasukan|Income/i);

            // Cleanup
            await row.locator('[data-testid="delete-btn"]').click();
            await page.locator('.modal-content:visible').last().locator('.btn-danger').click();
        });

        test('Hierarki: Membuat sub-kategori dan verifikasi indentasi', async ({ page }) => {
            const parentName = `Parent ${Date.now()}`;
            const childName = `Child ${Date.now()}`;

            // 1. Buat Parent
            await page.locator('[data-testid="add-btn"]').click();
            const parentModal = page.getByTestId('category-modal');
            await expect(parentModal).toBeVisible({ timeout: 15000 });

            await parentModal.locator('#category-name').fill(parentName);
            // Pilih modul finance agar dropdown tipe muncul (meskipun tidak dipakai sekarang)
            await parentModal.locator('#category-module').selectOption('finance');

            await parentModal.locator('button[type="submit"]').click();
            await expect(parentModal).not.toBeVisible();

            // 2. Buat Child
            await page.locator('[data-testid="add-btn"]').click();
            const childModal = page.getByTestId('category-modal');
            await expect(childModal).toBeVisible({ timeout: 15000 });

            await childModal.locator('#category-name').fill(childName);
            await childModal.locator('#category-module').selectOption('finance');

            // Pilih Parent di react-select
            const parentSelectInput = childModal.locator('#category-parent');
            await parentSelectInput.click({ force: true });
            await page.keyboard.type(parentName);
            await page.waitForTimeout(1000);
            await page.keyboard.press('Enter');

            await childModal.locator('button[type="submit"]').click();
            await expect(childModal).not.toBeVisible();

            // 3. Verifikasi Indentasi simpel
            const nameFilter = page.locator('thead input.form-control-sm').first();
            await nameFilter.fill(parentName);
            await page.waitForTimeout(2000);

            const childRow = page.locator('tbody tr').filter({ hasText: childName });
            await expect(childRow.locator('.ri-corner-down-right-line')).toBeVisible({ timeout: 10000 });

            // 4. Verifikasi Proteksi Orphan di UI: Parent tidak punya tombol delete jika ada Child
            const parentRowManual = page.locator('tr').filter({ hasText: parentName });
            const childRowInTable = page.locator('tr').filter({ hasText: childName });

            // Tunggu refresh data selesai
            await page.waitForTimeout(1000);

            // Pastikan tombol delete tidak ada di baris parent
            await expect(parentRowManual.locator('[data-testid="delete-btn"]')).not.toBeVisible();

            // 5. Cleanup: Hapus Child dulu baru Parent
            await childRowInTable.locator('[data-testid="delete-btn"]').click();
            await page.locator('.modal.show .btn-danger').click();
            // Tunggu data refresh
            await page.waitForResponse(resp => (resp.url().includes('/master/categories') || resp.url().includes('/categories')) && resp.request().method() === 'GET' && resp.status() === 200);
            await page.waitForTimeout(1000);
            await expect(childRowInTable).not.toBeVisible();

            // Setelah child dihapus, tombol delete di parent harus muncul
            await expect(parentRowManual.locator('[data-testid="delete-btn"]')).toBeVisible();

            await parentRowManual.locator('[data-testid="delete-btn"]').click();
            await page.locator('.modal.show .btn-danger').click();
            await page.waitForResponse(resp => (resp.url().includes('/master/categories') || resp.url().includes('/categories')) && resp.request().method() === 'GET' && resp.status() === 200);
            await expect(parentRowManual).not.toBeVisible();
        });

        test('Ikon & Warna: Sinkronisasi tampilan di tabel', async ({ page }) => {
            const testName = `Visual Cat ${Date.now()}`;
            await page.locator('[data-testid="add-btn"]').click();
            const modal = page.getByTestId('category-modal');
            await expect(modal).toBeVisible({ timeout: 15000 });

            await page.locator('[data-testid="category-name-input"]').fill(testName);
            await page.locator('[data-testid="category-module-select"]').selectOption('finance');

            // Pilih Ikon 'Bank Card' 
            const iconSelectInput = modal.locator('#category-icon');
            await iconSelectInput.click({ force: true });
            await page.keyboard.type('Bank Card');
            await page.waitForTimeout(500);
            await page.keyboard.press('Enter');

            // Pilih Warna 'Danger'
            const colorSelectInput = modal.locator('#category-color');
            await colorSelectInput.click({ force: true });
            await page.keyboard.type('danger');
            await page.waitForTimeout(500);
            await page.keyboard.press('Enter');

            await page.locator('[data-testid="category-submit-btn"]').click();
            await expect(modal).not.toBeVisible();

            // Verifikasi simpel
            const nameFilter = page.locator('thead input.form-control-sm').first();
            await nameFilter.fill(testName);
            await page.waitForTimeout(2000);
            const row = page.locator('tbody tr').filter({ hasText: testName });

            await expect(row.locator('.ri-bank-card-line')).toBeVisible();
            await expect(row.locator('.ri-bank-card-line')).toHaveClass(/text-danger/);

            // Cleanup
            await row.locator('[data-testid="delete-btn"]').click();
            await page.locator('.modal.show .btn-danger').click();
        });
    });

    test.describe('B. Interaksi Tabel & Statistik', () => {

        test('Pencarian: Filter nama dan pesan "No results"', async ({ page }) => {
            const nameFilter = page.locator('thead input.form-control-sm').first();
            await nameFilter.fill('ZXY_NON_EXISTENT_CATEGORY_999');
            await page.waitForTimeout(2000);
            await expect(page.locator('tbody tr').filter({ hasText: /Maaf|Sorry|Tidak ada hasil|No result/i })).toBeVisible();
        });

        test('Filter Modul: Memastikan data terfilter sesuai modul', async ({ page }) => {
            // Filter modul di baris ke-2
            const moduleFilterBtn = page.locator('thead tr').nth(1).locator('button').first();
            await moduleFilterBtn.click();

            // Pilih 'Finance' atau 'Keuangan' (karena kita sudah buat data finance di test sebelumnya)
            const financeCheckbox = page.locator('input[id$="-finance"]');
            await financeCheckbox.check();

            // Tutup dropdown
            await moduleFilterBtn.click();
            await page.waitForTimeout(2000); // Tunggu filter apply

            // Verifikasi cell modul di tabel
            const rows = page.locator('tbody tr');
            await expect(rows.first()).toBeVisible({ timeout: 10000 });
            const moduleText = await rows.first().locator('td').nth(3).textContent();
            expect(moduleText?.trim()).toMatch(/Keuangan|Finance/i);
        });

        test('Sinkronisasi Widget: Penambahan kategori meng-update angka statistik', async ({ page }) => {
            test.setTimeout(120000);
            // Gunakan selector paragraf judul di widget
            const widgetTitle = page.locator('p.text-muted', { hasText: /Total Categories|Total Kategori/i }).first();
            const widgetContainer = widgetTitle.locator('xpath=./..');

            // Tunggu animasi CountUp selesai (durasi 2 detik)
            await page.waitForTimeout(3000);

            const initialText = await widgetContainer.locator('h2').textContent();
            const initialCount = parseInt(initialText?.replace(/[^0-9]/g, '') || '0');

            // Tambah Kategori Baru
            const testName = `Stat Test ${Date.now()}`;
            await page.locator('[data-testid="add-btn"]').click();
            const modal = page.getByTestId('category-modal');
            await expect(modal).toBeVisible({ timeout: 15000 });

            await page.locator('[data-testid="category-name-input"]').fill(testName);
            await page.locator('[data-testid="category-module-select"]').selectOption('finance');
            await page.locator('[data-testid="category-submit-btn"]').click();
            await expect(modal).not.toBeVisible({ timeout: 15000 });

            // Cek apakah angka bertambah (Playwright auto-waits)
            await expect(async () => {
                const currentText = await widgetContainer.locator('h2').textContent();
                const currentCount = parseInt(currentText?.replace(/[^0-9]/g, '') || '0');
                expect(currentCount).toBe(initialCount + 1);
            }).toPass();

            // Cleanup
            const nameFilter = page.locator('thead input.form-control-sm').first();
            await nameFilter.fill(testName);
            await page.waitForTimeout(2000);
            const row = page.locator('tbody tr').filter({ hasText: testName });
            await expect(row).toBeVisible({ timeout: 10000 });
            await row.locator('[data-testid="delete-btn"]').click();
            await page.locator('.modal.show .btn-danger').click();
        });
    });

    test.describe('C. Keamanan & Batasan (Edge Cases)', () => {

        test('System Category: Proteksi penghapusan', async ({ page }) => {
            // Kategori system tidak boleh punya tombol delete
            const systemRow = page.locator('tr').filter({ has: page.locator('.badge:text-is("System")') }).first();
            if (await systemRow.isVisible()) {
                await expect(systemRow.locator('[data-testid="delete-btn"]')).not.toBeVisible();
            }
        });

        test('Toggle Active: Merubah status kategori', async ({ page }) => {
            const testName = `Toggle Test ${Date.now()}`;
            await page.locator('[data-testid="add-btn"]').click();
            const modal = page.getByTestId('category-modal');
            await expect(modal).toBeVisible({ timeout: 15000 });

            await page.locator('[data-testid="category-name-input"]').fill(testName);
            await page.locator('[data-testid="category-module-select"]').selectOption('finance');
            await page.locator('[data-testid="category-submit-btn"]').click();
            await expect(modal).not.toBeVisible({ timeout: 15000 });

            const nameFilter = page.locator('thead input.form-control-sm').first();
            await nameFilter.fill(testName);
            await page.waitForTimeout(2000);
            const row = page.locator('tr').filter({ hasText: testName });

            // Edit to Inactive
            await row.locator('[data-testid="edit-btn"]').click();
            await page.locator('.modal-content #category-active-switch').uncheck();

            const responsePromise = page.waitForResponse(resp =>
                resp.url().includes('/master/categories/') &&
                resp.request().method().toUpperCase() === 'PATCH'
            );
            await page.locator('.modal-content button[type="submit"]').click();
            await responsePromise;

            await expect(row).toContainText(/Nonaktif|Inactive/i);

            // Cleanup
            await row.locator('[data-testid="delete-btn"]').click();
            await page.locator('.modal-content:visible').last().locator('.btn-danger').click();
        });

        test('Transaction Protection: Tidak bisa menghapus kategori yang ada transaksi', async ({ page }) => {
            const protectedName = 'Dummy Sudah Transaksi';
            const nameFilter = page.locator('thead input.form-control-sm').first();
            await nameFilter.fill(protectedName);
            await page.waitForTimeout(2000);

            const row = page.locator('tr').filter({ hasText: protectedName });
            if (await row.isVisible()) {
                await row.locator('[data-testid="delete-btn"]').click();
                await page.locator('.modal.show .btn-danger').click();

                // Verifikasi Toast Error 
                await expect(page.locator('.toast-error, [role="alert"]')).toBeVisible({ timeout: 10000 });
                await expect(page.locator('.toast-error, [role="alert"]')).toContainText(/digunakan oleh|used by/i);

                // Tutup modal paksa (Klik di luar atau tombol Close)
                await page.keyboard.press('Escape');
            }
        });

        test('Bulk Delete Safety: Menghapus banyak sekaligus dengan proteksi transaksi', async ({ page }) => {
            test.setTimeout(120000);
            const dummyName = `Bulk Dummy ${Date.now()}`;
            await page.locator('[data-testid="add-btn"]').click();
            const modal = page.getByTestId('category-modal');
            await expect(modal).toBeVisible({ timeout: 15000 });

            await page.locator('[data-testid="category-name-input"]').fill(dummyName);
            await page.locator('[data-testid="category-module-select"]').selectOption('finance');
            await page.locator('[data-testid="category-submit-btn"]').click();
            await expect(modal).not.toBeVisible();

            const nameFilter = page.locator('thead input.form-control-sm').first();
            // Bersihkan filter
            await nameFilter.fill('');
            await page.waitForTimeout(2000);

            // 1. Pilih Dummy Baru (Aman dihapus)
            await page.locator('tr').filter({ hasText: dummyName }).locator('input[type="checkbox"]').check();

            // 2. Pilih "Dummy Sudah Transaksi" (Gagal karena transaksi)
            await page.locator('tr').filter({ hasText: 'Dummy Sudah Transaksi' }).locator('input[type="checkbox"]').check();

            // 3. Pilih "Bahan Makanan" (Gagal karena Kategori Sistem)
            await page.locator('tr').filter({ hasText: 'Bahan Makanan' }).locator('input[type="checkbox"]').check();

            // Klik Hapus Terpilih
            const bulkResponsePromise = page.waitForResponse(resp =>
                /\/master\/categories\/?(\?.*)?$/.test(resp.url()) &&
                resp.request().method().toUpperCase() === 'DELETE'
            );
            await page.locator('[data-testid="bulk-delete-btn"]').click();
            await page.locator('.modal-content:visible').last().locator('.btn-danger').click();
            await bulkResponsePromise;

            // Harus muncul error report (Toast) karena ada yang gagal
            const toast = page.locator('.toast-error, [role="alert"]');
            await expect(toast).toBeVisible({ timeout: 15000 });
            await expect(toast).toContainText(/Beberapa kategori gagal dihapus|Some categories failed to delete/i);
            await expect(toast).toContainText('Dummy Sudah Transaksi');
            await expect(toast).toContainText('Bahan Makanan');

            // Dummy harusnya TELAH terhapus (Partial Success)
            await nameFilter.fill(dummyName);
            await page.waitForTimeout(1000);
            await expect(page.locator('tbody tr').filter({ hasText: dummyName })).not.toBeVisible();
        });
    });

});
