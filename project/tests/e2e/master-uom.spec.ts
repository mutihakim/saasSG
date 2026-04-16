import { expect, test } from '@playwright/test';

const targetUrl = '/admin/master/uom';

test.describe('Master Data - Unit of Measurement (UOM) Comprehensive Suite', () => {

    test.beforeEach(async ({ page }) => {
        // Since we use storageState, we should be already logged in as admin.
        // We just need to go to the target page.
        await page.goto(targetUrl);
        await page.waitForLoadState('networkidle');
    });

    test.describe('A. Fitur Spesifik Modul & Form', () => {

        test('Validasi Input: Field required tidak boleh kosong', async ({ page }) => {
            await page.locator('[data-testid="add-btn"]').click();
            const modal = page.locator('.modal-content:visible');
            await expect(modal).toBeVisible({ timeout: 15000 });

            // Coba simpan tanpa isi apa pun
            await page.getByTestId('uom-submit-btn').click();

            // Verifikasi browser prevent submit (checkValidity) pada salah satu field wajib
            const codeInput = page.getByTestId('uom-code-input');
            const isValid = await codeInput.evaluate((el: any) => el.checkValidity());
            expect(isValid).toBe(false);

            await page.getByRole('button', { name: /Batal|Cancel/i }).click();
        });

        test('Lengkap CRUD: Simpan, Cari, Edit, dan Hapus', async ({ page }) => {
            const timestamp = Date.now();
            const dummyCode = `U${timestamp.toString().slice(-5)}`;
            const dummyName = `Unit ${timestamp}`;
            const dummyAbbr = `u${timestamp.toString().slice(-3)}`;
            
            // 1. CREATE (As a Base Unit)
            await page.locator('[data-testid="add-btn"]').click();
            await page.getByTestId('uom-code-input').fill(dummyCode);
            await page.getByTestId('uom-name-input').fill(dummyName);
            await page.getByTestId('uom-abbr-input').fill(dummyAbbr);
            
            // Pilih dimensi via react-select
            await page.locator('.react-select__control').first().click();
            await page.keyboard.type('Berat');
            await page.keyboard.press('Enter');

            // Factor should be disabled for base units (null base unit)
            await expect(page.getByTestId('uom-factor-input')).toBeDisabled();
            
            const createResponse = page.waitForResponse(resp => 
                resp.url().includes('/master/uom') && resp.request().method() === 'POST'
            );
            await page.getByTestId('uom-submit-btn').click();
            await createResponse;

            await expect(page.locator('.toast-success, .Toastify__toast--success')).toBeVisible({ timeout: 10000 });

            // 2. SEARCH & VERIFY
            const codeFilter = page.locator('thead input.form-control-sm').first();
            await codeFilter.fill(dummyCode);
            await page.waitForTimeout(1000);
            
            const row = page.locator('tbody tr').filter({ has: page.locator('td').nth(1).filter({ hasText: dummyCode }) });
            await expect(row).toBeVisible();
            await expect(row).toContainText(dummyName);

            // 3. EDIT (ALL FIELDS, including converting to Child Unit)
            const updatedCode = `V${timestamp.toString().slice(-5)}`;
            const updatedName = `Updated ${dummyName}`;
            const updatedAbbr = `v${timestamp.toString().slice(-3)}`;

            await row.locator('.dropdown-toggle').click();
            await page.getByTestId('edit-btn').click();
            
            await page.getByTestId('uom-code-input').fill(updatedCode);
            await page.getByTestId('uom-name-input').fill(updatedName);
            await page.getByTestId('uom-abbr-input').fill(updatedAbbr);
            
            // Pilih Base Unit 'KG' (Kilogram) agar Factor aktif
            await page.locator('[data-testid="uom-base-unit-select"] .react-select__control').click();
            await page.keyboard.type('KG');
            await page.keyboard.press('Enter');

            // Sekarang factor harusnya enabled
            await expect(page.getByTestId('uom-factor-input')).toBeEnabled();
            await page.getByTestId('uom-factor-input').fill('1000');
            await page.getByTestId('uom-sort-order-input').fill('5');
            
            const updateResponse = page.waitForResponse(resp => 
                resp.url().includes('/master/uom/') && resp.request().method() === 'PATCH'
            );
            await page.getByTestId('uom-submit-btn').click();
            await updateResponse;
            
            await expect(page.locator('.toast-success, .Toastify__toast--success')).toBeVisible();

            // Re-filter with updated code
            await codeFilter.fill(updatedCode);
            await page.waitForTimeout(1000);
            const updatedRow = page.locator('tbody tr').filter({ has: page.locator('td').nth(1).filter({ hasText: updatedCode }) });
            await expect(updatedRow).toContainText(updatedName);
            await expect(updatedRow).toContainText('1000');
            await expect(updatedRow).toContainText('(KG)');

            // 4. DELETE
            await updatedRow.locator('.dropdown-toggle').click();
            await page.getByTestId('delete-btn').click();
            
            const confirmBtn = page.locator('.modal.show .btn-danger');
            await expect(confirmBtn).toBeVisible();
            await confirmBtn.click();
            
            await expect(page.locator('.toast-success, .Toastify__toast--success')).toBeVisible();
            await expect(updatedRow).not.toBeVisible();
        });

        test('Validasi Duplikat: Kode tidak boleh kembar', async ({ page }) => {
            // Kita pakai KG (Kilogram) yang biasanya ada dari seeder
            const existingCode = 'KG'; 
            
            // Scenario 1: Add Duplicate
            await page.locator('[data-testid="add-btn"]').click();
            await page.getByTestId('uom-code-input').fill(existingCode);
            await page.getByTestId('uom-name-input').fill('Duplicate Unit');
            await page.getByTestId('uom-abbr-input').fill('dup');
            await page.getByTestId('uom-submit-btn').click();

            const errorToast = page.locator('.toast-error, .Toastify__toast--error, .alert-danger').first();
            await expect(errorToast).toBeVisible();
            await expect(errorToast).toContainText(/sudah ada|already exists|taken/i);
            
            await page.getByRole('button', { name: /Batal|Cancel/i }).click();

            // Scenario 2: Edit to Duplicate
            const timestamp = Date.now().toString().slice(-5);
            const dummyCode = `D${timestamp}`;
            await page.locator('[data-testid="add-btn"]').click();
            await page.getByTestId('uom-code-input').fill(dummyCode);
            await page.getByTestId('uom-name-input').fill('Temp Unit');
            await page.getByTestId('uom-abbr-input').fill('tmp');
            await page.getByTestId('uom-submit-btn').click();
            await page.waitForTimeout(1000);

            const row = page.locator('tbody tr').filter({ has: page.locator('td').nth(1).filter({ hasText: dummyCode }) });
            await row.locator('.dropdown-toggle').click();
            await page.getByTestId('edit-btn').click();
            
            await page.getByTestId('uom-code-input').fill(existingCode);
            await page.getByTestId('uom-submit-btn').click();
            
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
            
            // Cari KG
            await filters.nth(0).fill('KG');
            await page.waitForTimeout(1000);
            await expect(page.locator('tbody')).toContainText('KG');
            
            // Cari Gram (Should find Kilogram)
            await filters.nth(0).fill('');
            await filters.nth(1).fill('Gram');
            await page.waitForTimeout(1000);
            await expect(page.locator('tbody')).toContainText(/Kilogram/i);

            // No Result
            await filters.nth(1).fill('ZXY_NON_EXISTENT_UOM');
            await page.waitForTimeout(1000);
            await expect(page.locator('tbody')).toContainText(/tidak ada|no result/i);
        });

        test('Filter Dimensi: Filter data berdasarkan tipe dimensi', async ({ page }) => {
            const dimensionFilterBtn = page.locator('thead tr').nth(1).locator('button').first();
            await dimensionFilterBtn.click();

            // Pilih 'Berat' (Biasanya ada KG)
            const beratCheckbox = page.locator('input[id$="-berat"]');
            await beratCheckbox.check();

            await dimensionFilterBtn.click(); // Close dropdown
            await page.waitForTimeout(1000);

            const rows = page.locator('tbody tr');
            await expect(rows.first()).toContainText(/berat/i);
        });

        test('Toggle Active: Merubah status menjadi Nonaktif', async ({ page }) => {
            const timestamp = Date.now().toString().slice(-5);
            const dummyCode = `OFF${timestamp}`;
            await page.locator('[data-testid="add-btn"]').click();
            await page.getByTestId('uom-code-input').fill(dummyCode);
            await page.getByTestId('uom-name-input').fill('Active Unit');
            await page.getByTestId('uom-abbr-input').fill('act');
            
            // Wait for create response
            const createResponse = page.waitForResponse(r => r.url().includes('/master/uom') && r.request().method() === 'POST');
            await page.getByTestId('uom-submit-btn').click();
            await createResponse;
            await page.waitForTimeout(1000);

            // Filter to find the newly created unit
            const codeFilter = page.locator('thead input.form-control-sm').first();
            await codeFilter.fill(dummyCode);
            await page.waitForTimeout(1000);

            const row = page.locator('tbody tr').filter({ has: page.locator('td').nth(1).filter({ hasText: dummyCode }) });
            await row.locator('.dropdown-toggle').click();
            await page.getByTestId('edit-btn').click();
            
            await page.getByTestId('uom-active-switch').uncheck();
            
            const updateResponse = page.waitForResponse(r => r.url().includes('/master/uom/') && r.request().method() === 'PATCH');
            await page.getByTestId('uom-submit-btn').click();
            await updateResponse;
            
            await expect(row).toContainText(/Nonaktif|Inactive/i);

            // Cleanup
            await row.locator('.dropdown-toggle').click();
            await page.getByTestId('delete-btn').click();
            await page.locator('.modal.show .btn-danger').click();
        });
    });

    test.describe('C. Keamanan & Batasan (Edge Cases)', () => {

        test('Base Unit Protection: Proteksi penghapusan unit yang digunakan sebagai basis', async ({ page }) => {
            // Kita buat satu UOM sebagai basis, lalu satu lagi yang menggunakan dia.
            const timestamp = Date.now().toString().slice(-5);
            const baseCode = `BA${timestamp}`;
            const childCode = `CH${timestamp}`;

            // 1. Create Base
            await page.locator('[data-testid="add-btn"]').click();
            await page.getByTestId('uom-code-input').fill(baseCode);
            await page.getByTestId('uom-name-input').fill('Base Unit Test');
            await page.getByTestId('uom-abbr-input').fill('bat');
            await page.getByTestId('uom-submit-btn').click();
            await page.waitForTimeout(1000);

            // 2. Create Child using Base
            await page.locator('[data-testid="add-btn"]').click();
            await page.getByTestId('uom-code-input').fill(childCode);
            await page.getByTestId('uom-name-input').fill('Child Unit Test');
            await page.getByTestId('uom-abbr-input').fill('cat');
            
            // Pilih Base Unit in Modal
            await page.locator('[data-testid="uom-base-unit-select"] .react-select__control').click();
            await page.keyboard.type(baseCode);
            await page.keyboard.press('Enter');
            
            await page.getByTestId('uom-submit-btn').click();
            await page.waitForTimeout(1000);

            // 3. Try Delete Base
            const codeFilter = page.locator('thead input.form-control-sm').first();
            await codeFilter.fill(baseCode);
            await page.waitForTimeout(1000);

            const row = page.locator('tbody tr').filter({ has: page.locator('td').nth(1).filter({ hasText: baseCode }) });
            await row.locator('.dropdown-toggle').click();
            await page.getByTestId('delete-btn').click();
            
            const deleteResponse = page.waitForResponse(resp => 
                resp.url().includes(`/master/uom/`) && resp.request().method() === 'DELETE'
            );
            await page.locator('.modal.show .btn-danger').click();
            await deleteResponse;
            
            const toast = page.locator('.toast-error, .Toastify__toast--error').first();
            await expect(toast).toBeVisible({ timeout: 15000 });
            await expect(toast).toContainText(/Sedang Digunakan|in Use/i);
            await expect(toast).toContainText(/digunakan sebagai pengali dasar|used as a base unit/i);

            // 4. Cleanup: Delete Child then Base
            await codeFilter.fill(childCode);
            await page.waitForTimeout(1000);
            const childRow = page.locator('tbody tr').filter({ has: page.locator('td').nth(1).filter({ hasText: childCode }) });
            await childRow.locator('.dropdown-toggle').click();
            await page.getByTestId('delete-btn').click();
            await page.locator('.modal.show .btn-danger').click();
            await page.waitForTimeout(1000);

            await codeFilter.fill(baseCode);
            await page.waitForTimeout(1000);
            const baseRow = page.locator('tbody tr').filter({ has: page.locator('td').nth(1).filter({ hasText: baseCode }) });
            await baseRow.locator('.dropdown-toggle').click();
            await page.getByTestId('delete-btn').click();
            await page.locator('.modal.show .btn-danger').click();
        });

        test('Bulk Delete Safety: Laporan sukses parsial dengan proteksi base unit', async ({ page }) => {
            const timestamp = Date.now().toString().slice(-5);
            const baseCode = `BBA${timestamp}`;
            const childCode = `BCH${timestamp}`;
            const safeCode = `BSA${timestamp}`;
            
            // 1. Setup Data: Base, Child (using Base), and Safe unit
            // Create Base
            await page.locator('[data-testid="add-btn"]').click();
            await page.getByTestId('uom-code-input').fill(baseCode);
            await page.getByTestId('uom-name-input').fill('Bulk Base');
            await page.getByTestId('uom-abbr-input').fill('bb');
            await page.getByTestId('uom-submit-btn').click();
            await page.waitForTimeout(1000);

            // Create Child
            await page.locator('[data-testid="add-btn"]').click();
            await page.getByTestId('uom-code-input').fill(childCode);
            await page.getByTestId('uom-name-input').fill('Bulk Child');
            await page.getByTestId('uom-abbr-input').fill('bc');
            await page.locator('[data-testid="uom-base-unit-select"] .react-select__control').click();
            await page.keyboard.type(baseCode);
            await page.keyboard.press('Enter');
            await page.getByTestId('uom-submit-btn').click();
            await page.waitForTimeout(1000);

            // Create Safe
            await page.locator('[data-testid="add-btn"]').click();
            await page.getByTestId('uom-code-input').fill(safeCode);
            await page.getByTestId('uom-name-input').fill('Bulk Safe');
            await page.getByTestId('uom-abbr-input').fill('bs');
            await page.getByTestId('uom-submit-btn').click();
            await page.waitForTimeout(1000);

            // 2. Select Base (Protected) and Safe (Unprotected)
            await page.locator('thead input.form-control-sm').first().fill('');
            await page.waitForTimeout(1000);

            // Select specifically by the code in the first column to avoid matching the base_unit_code reference in other rows
            await page.locator('tr').filter({ has: page.locator('td').nth(1).filter({ hasText: new RegExp(`^${baseCode}$`) }) }).first().locator('input[type="checkbox"]').check();
            await page.locator('tr').filter({ has: page.locator('td').nth(1).filter({ hasText: new RegExp(`^${safeCode}$`) }) }).first().locator('input[type="checkbox"]').check();

            const bulkBtn = page.getByTestId('bulk-delete-btn');
            await expect(bulkBtn).toBeVisible();
            await bulkBtn.click();

            const bulkResponse = page.waitForResponse(resp => 
                resp.url().includes('/master/uom') && resp.request().method() === 'DELETE'
            );
            await page.locator('.modal.show .btn-danger').click();
            await bulkResponse;

            const toast = page.locator('.toast-error, .Toastify__toast--error').first();
            await expect(toast).toBeVisible({ timeout: 15000 });
            await expect(toast).toContainText(/Beberapa satuan gagal dihapus|Some units failed to delete/i);
            
            // Check detail for the base unit
            await expect(toast).toContainText(baseCode);
            await expect(toast).toContainText(/digunakan sebagai pengali dasar|used as a base unit/i);
            
            // 3. Verify Safe is gone, Base and Child remain
            await page.reload();
            await page.waitForLoadState('networkidle');
            await expect(page.locator('tbody')).not.toContainText(safeCode);
            await expect(page.locator('tbody')).toContainText(baseCode);
            await expect(page.locator('tbody')).toContainText(childCode);

            // 4. Cleanup Child then Base
            const codeFilter = page.locator('thead input.form-control-sm').first();
            
            await codeFilter.fill(childCode);
            await page.waitForTimeout(1000);
            await page.locator('tbody tr').filter({ has: page.locator('td').nth(1).filter({ hasText: childCode }) }).locator('.dropdown-toggle').click();
            await page.getByTestId('delete-btn').click();
            await page.locator('.modal.show .btn-danger').click();
            await page.waitForTimeout(1000);

            await codeFilter.fill(baseCode);
            await page.waitForTimeout(1000);
            await page.locator('tbody tr').filter({ has: page.locator('td').nth(1).filter({ hasText: baseCode }) }).locator('.dropdown-toggle').click();
            await page.getByTestId('delete-btn').click();
            await page.locator('.modal.show .btn-danger').click();
        });
    });
});
