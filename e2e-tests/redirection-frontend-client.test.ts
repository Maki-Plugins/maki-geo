import { test, expect, Page } from "@playwright/test";
import { logIn } from "./playwright-utils"; // If needed for setup/teardown

// Helper function to set plugin mode via WP-CLI or API if possible,
// otherwise needs manual setup or separate test runs.
async function ensureClientMode(page: Page) {
  // Placeholder: Implement logic to switch to Client mode if needed.
  console.warn("Ensure Maki Geo is in Client Mode before running these tests.");
   // Example using admin UI (adjust selectors):
  // await logIn({ page });
  // await page.goto('/wp-admin/admin.php?page=maki-geo');
  // await page.locator('select.select:near(:text("Geo targeting method"))').selectOption('client');
  // await page.getByRole('button', { name: 'Save settings' }).click();
  // await expect(page.locator('.text-green-600')).toContainText('Settings saved successfully!');
}

// Helper function to clean up redirections (can reuse from server test file)
async function deleteAllRedirections(page: Page) {
    await logIn({ page }); // Need to be logged in
    await page.goto('/wp-admin/admin.php?page=maki-geo');
    await page.getByRole('button', { name: 'Geo redirection' }).click();

    const deleteButtons = await page.locator('[data-testid="mgeo_delete_redirection"]').all();

    page.on('dialog', dialog => dialog.accept()); // Auto-accept confirmation

    for (const button of deleteButtons) {
        await button.click();
        await page.waitForTimeout(200);
    }
     page.off('dialog', () => {});
}

// Helper function to create a basic redirection rule (can reuse)
async function createRedirectionRule(page: Page, name: string, country: string, redirectUrl: string, passPath: boolean, passQuery: boolean, exclusions: {type: string, value: string}[] = []) {
    // (Implementation is the same as in server test file)
    await page.getByRole('button', { name: 'Add new redirection' }).click();
    await page.getByLabel('Geo Redirect Name').fill(name);
    await page.locator('.mgeo-geo-rule-select input[placeholder*="Country"]').fill(country);
    await page.getByText(country, { exact: true }).click();
    await page.getByLabel('Redirect URL').fill(redirectUrl);
    const passPathToggle = page.locator('input[type="checkbox"]').near(page.getByText('Pass page path'));
    if (await passPathToggle.isChecked() !== passPath) { await passPathToggle.click(); }
    const passQueryToggle = page.locator('input[type="checkbox"]').near(page.getByText('Pass query string'));
    if (await passQueryToggle.isChecked() !== passQuery) { await passQueryToggle.click(); }
    for (const exclusion of exclusions) {
        await page.getByRole('button', { name: 'Add Exclusion' }).click();
        const lastExclusion = page.locator('.join').filter({ hasText: 'Value to exclude'}).last();
        await lastExclusion.locator('select').selectOption({ label: exclusion.type.replace(/_/g, ' ') });
        await lastExclusion.locator('input[type="text"]').fill(exclusion.value);
    }
    await page.getByRole('button', { name: 'Create Redirection' }).click();
    await expect(page.getByRole('heading', { name })).toBeVisible();
}


test.describe("Frontend Geo Redirection (Client Mode)", () => {
  test.beforeAll(async ({ browser }) => {
    // Ensure client mode is set once
    const page = await browser.newPage();
    await ensureClientMode(page);
    await page.close();
  });

   test.beforeEach(async ({ page }) => {
    // Clean up rules if needed, though API mocking makes rules less critical
     await deleteAllRedirections(page);
     // It might still be useful to have *some* rule present to ensure the script is enqueued
     await page.goto('/wp-admin/admin.php?page=maki-geo');
     await page.getByRole('button', { name: 'Geo redirection' }).click();
     await createRedirectionRule(page, 'Client Test Rule', 'US', 'http://dummy.com', true, true);

     // Clear sessionStorage before each test
     await page.evaluate(() => window.sessionStorage.clear());
  });

  test.afterEach(async ({ page }) => {
     await deleteAllRedirections(page);
  });

  // --- Test cases will be added below ---

});
