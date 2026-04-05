import { expect, test, type Page } from '@playwright/test';
import { URL } from 'node:url';

const tenantSlug = process.env.E2E_TENANT_SLUG ?? 'keluarga-cemara';
const financeUrl = process.env.E2E_FINANCE_URL ?? `https://${tenantSlug}.appsah.my.id/finance`;
const ownerEmail = process.env.E2E_FINANCE_OWNER_EMAIL ?? `owner@${tenantSlug}.com`;
const ownerPassword = process.env.E2E_FINANCE_OWNER_PASSWORD ?? 'password';
const memberEmail = process.env.E2E_FINANCE_MEMBER_EMAIL ?? `member@${tenantSlug}.com`;
const memberPassword = process.env.E2E_FINANCE_MEMBER_PASSWORD ?? 'password';

function loginUrlFrom(targetUrl: string) {
    try {
        const url = new URL(targetUrl);
        return `${url.origin}/login`;
    } catch {
        return '/login';
    }
}

async function login(page: Page, email: string, password: string) {
    await page.addInitScript(() => {
        window.localStorage.setItem('I18N_LANGUAGE', 'en');
    });

    await page.goto(loginUrlFrom(financeUrl));
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();
}

async function openFinance(page: Page) {
    await page.goto(financeUrl);
    await expect(page.getByText('Transactions').first()).toBeVisible();
}

async function createExpenseTransaction(page: Page, description: string, amount: string) {
    await page.getByTestId('finance-fab').click();
    await page.getByTestId('finance-composer-option-pengeluaran').click();
    await expect(page.getByTestId('finance-transaction-modal')).toBeVisible();
    await page.getByPlaceholder('0.00').fill(amount);
    await page.getByPlaceholder('Buy groceries, Netflix subscription, etc.').fill(description);
    await page.getByTestId('finance-transaction-save').click();
    await expect(page.getByText(description)).toBeVisible();
}

test.describe('finance e2e', () => {
    test('owner can crud transaction, account, and budget', async ({ page }) => {
        await login(page, ownerEmail, ownerPassword);
        await openFinance(page);

        const txDescription = `Owner Tx ${Date.now()}`;
        await createExpenseTransaction(page, txDescription, '15000');

        await page.getByText(txDescription).click();
        await expect(page.getByTestId('finance-transaction-detail')).toBeVisible();
        await page.getByTestId('finance-detail-edit').click();
        await expect(page.getByTestId('finance-transaction-modal')).toBeVisible();
        await page.getByPlaceholder('Buy groceries, Netflix subscription, etc.').fill(`${txDescription} Updated`);
        await page.getByTestId('finance-transaction-save').click();
        await expect(page.getByText(`${txDescription} Updated`)).toBeVisible();

        await page.getByText(`${txDescription} Updated`).click();
        await page.getByTestId('finance-detail-delete').click();
        await expect(page.getByTestId('confirm-delete-modal')).toBeVisible();
        await page.getByTestId('confirm-delete-action').click();
        await expect(page.getByText(`${txDescription} Updated`)).toHaveCount(0);

        await page.getByRole('button', { name: 'Accounts' }).click();
        await page.getByTestId('finance-account-add').click();
        await expect(page.getByTestId('finance-account-modal')).toBeVisible();
        await page.locator('[data-testid="finance-account-modal"] input').first().fill(`Owner Account ${Date.now()}`);
        await page.getByTestId('finance-account-save').click();
        await expect(page.getByText('Owner Account')).toBeVisible();

        const ownerAccountRow = page.locator('[data-testid^="finance-account-row-"]').filter({ hasText: 'Owner Account' }).first();
        await ownerAccountRow.click();
        await expect(page.getByTestId('finance-account-modal')).toBeVisible();
        await page.locator('[data-testid="finance-account-modal"] input').first().fill('Owner Account Updated');
        await page.getByTestId('finance-account-save').click();
        await expect(page.getByText('Owner Account Updated')).toBeVisible();
        await page.locator('[data-testid^="finance-account-row-"]').filter({ hasText: 'Owner Account Updated' }).first().click();
        await page.getByTestId('finance-account-delete').click();
        await page.getByTestId('confirm-delete-action').click();
        await expect(page.getByText('Owner Account Updated')).toHaveCount(0);

        await page.getByRole('button', { name: 'More' }).click();
        await page.getByRole('button', { name: 'Budgets Track shared and personal budget usage.' }).click();
        await page.getByTestId('finance-budget-add').click();
        await expect(page.getByTestId('finance-budget-modal')).toBeVisible();
        await page.locator('[data-testid="finance-budget-modal"] input').first().fill(`Owner Budget ${Date.now()}`);
        await page.locator('[data-testid="finance-budget-modal"] input[type="number"]').fill('250000');
        await page.getByTestId('finance-budget-save').click();
        await expect(page.getByText('Owner Budget')).toBeVisible();

        const ownerBudgetEdit = page.locator('[data-testid^="finance-budget-edit-"]').first();
        await ownerBudgetEdit.click();
        await expect(page.getByTestId('finance-budget-modal')).toBeVisible();
        await page.locator('[data-testid="finance-budget-modal"] input').first().fill('Owner Budget Updated');
        await page.getByTestId('finance-budget-save').click();
        await expect(page.getByText('Owner Budget Updated')).toBeVisible();
        await page.locator('[data-testid^="finance-budget-edit-"]').first().click();
        await page.getByTestId('finance-budget-delete').click();
        await page.getByTestId('confirm-delete-action').click();
        await expect(page.getByText('Owner Budget Updated')).toHaveCount(0);
    });

    test('member can crud private account and budget but cannot manage shared structure', async ({ page }) => {
        await login(page, memberEmail, memberPassword);
        await openFinance(page);

        await page.getByRole('button', { name: 'Accounts' }).click();
        await page.getByTestId('finance-account-add').click();
        await expect(page.getByTestId('finance-account-modal')).toBeVisible();
        await page.locator('[data-testid="finance-account-modal"] input').first().fill(`Member Private Account ${Date.now()}`);
        await page.getByTestId('finance-account-save').click();
        await expect(page.getByText('Member Private Account')).toBeVisible();

        const memberAccountRow = page.locator('[data-testid^="finance-account-row-"]').filter({ hasText: 'Member Private Account' }).first();
        await memberAccountRow.click();
        await expect(page.getByTestId('finance-account-modal')).toBeVisible();
        await expect(page.getByText('Shared')).toHaveCount(0);
        await page.locator('[data-testid="finance-account-modal"] input').first().fill('Member Private Account Updated');
        await page.getByTestId('finance-account-save').click();
        await expect(page.getByText('Member Private Account Updated')).toBeVisible();
        await page.locator('[data-testid^="finance-account-row-"]').filter({ hasText: 'Member Private Account Updated' }).first().click();
        await page.getByTestId('finance-account-delete').click();
        await page.getByTestId('confirm-delete-action').click();
        await expect(page.getByText('Member Private Account Updated')).toHaveCount(0);

        await page.getByRole('button', { name: 'More' }).click();
        await page.getByRole('button', { name: 'Budgets Track shared and personal budget usage.' }).click();
        await page.getByTestId('finance-budget-add').click();
        await expect(page.getByTestId('finance-budget-modal')).toBeVisible();
        await page.locator('[data-testid="finance-budget-modal"] input').first().fill(`Member Private Budget ${Date.now()}`);
        await page.locator('[data-testid="finance-budget-modal"] input[type="number"]').fill('150000');
        await page.getByTestId('finance-budget-save').click();
        await expect(page.getByText('Member Private Budget')).toBeVisible();

        await page.locator('[data-testid^="finance-budget-edit-"]').first().click();
        await expect(page.getByTestId('finance-budget-modal')).toBeVisible();
        await expect(page.getByText('Shared')).toHaveCount(0);
        await page.locator('[data-testid="finance-budget-modal"] input').first().fill('Member Private Budget Updated');
        await page.getByTestId('finance-budget-save').click();
        await expect(page.getByText('Member Private Budget Updated')).toBeVisible();
        await page.locator('[data-testid^="finance-budget-edit-"]').first().click();
        await page.getByTestId('finance-budget-delete').click();
        await page.getByTestId('confirm-delete-action').click();
        await expect(page.getByText('Member Private Budget Updated')).toHaveCount(0);
    });
});
