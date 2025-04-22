import { test, expect, Page } from "@playwright/test";
import { logIn } from "./playwright-utils"; // Assuming login is needed to set up rules

// Helper function to set plugin mode via WP-CLI or API if possible,
// otherwise needs manual setup or separate test runs.
// For now, assume Server mode is set.
async function ensureServerMode(page: Page) {
  // Placeholder: Implement logic to switch to Server mode if needed.
  // This might involve navigating the admin UI or using WP-CLI via wp-env run.
  console.warn("Ensure Maki Geo is in Server Mode before running these tests.");
  // Example using admin UI (adjust selectors):
  // await logIn({ page });
  // await page.goto('/wp-admin/admin.php?page=maki-geo');
  // await page.locator('select.select:near(:text("Geo targeting method"))').selectOption('server');
  // await page.getByRole('button', { name: 'Save settings' }).click();
  // await expect(page.locator('.text-green-600')).toContainText('Settings saved successfully!');
}

// Helper function to clean up redirections
async function deleteAllRedirections(page: Page) {
    await logIn({ page }); // Need to be logged in
    await page.goto('/wp-admin/admin.php?page=maki-geo');
    await page.getByRole('button', { name: 'Geo redirection' }).click();

    const deleteButtons = await page.locator('[data-testid="mgeo_delete_redirection"]').all();

    page.on('dialog', dialog => dialog.accept()); // Auto-accept confirmation

    for (const button of deleteButtons) {
        await button.click();
        // Add a small wait or check for the element to be gone if needed
        await page.waitForTimeout(200); // Simple wait
    }
     page.off('dialog', () => {}); // Remove listener
}


// Helper function to create a basic redirection rule
async function createRedirectionRule(page: Page, name: string, country: string, redirectUrl: string, passPath: boolean, passQuery: boolean, exclusions: {type: string, value: string}[] = []) {
    await page.getByRole('button', { name: 'Add new redirection' }).click();
    await page.getByLabel('Geo Redirect Name').fill(name);
    await page.locator('.mgeo-geo-rule-select input[placeholder*="Country"]').fill(country); // Adjust selector if needed
    await page.getByText(country, { exact: true }).click(); // Select from dropdown

    await page.getByLabel('Redirect URL').fill(redirectUrl);

    // Set passPath
    const passPathToggle = page.locator('input[type="checkbox"]').near(page.getByText('Pass page path'));
    if (await passPathToggle.isChecked() !== passPath) {
        await passPathToggle.click();
    }

     // Set passQuery
    const passQueryToggle = page.locator('input[type="checkbox"]').near(page.getByText('Pass query string'));
    if (await passQueryToggle.isChecked() !== passQuery) {
        await passQueryToggle.click();
    }

    // Add exclusions
    for (const exclusion of exclusions) {
        await page.getByRole('button', { name: 'Add Exclusion' }).click();
        const lastExclusion = page.locator('.join').filter({ hasText: 'Value to exclude'}).last();
        await lastExclusion.locator('select').selectOption({ label: exclusion.type.replace(/_/g, ' ') }); // Match label text
        await lastExclusion.locator('input[type="text"]').fill(exclusion.value);
    }


    await page.getByRole('button', { name: 'Create Redirection' }).click();
    await expect(page.getByRole('heading', { name })).toBeVisible();
}


test.describe("Frontend Geo Redirection (Server Mode)", () => {
  test.beforeAll(async ({ browser }) => {
    // Ensure server mode is set once before all tests in this suite
    const page = await browser.newPage();
    await ensureServerMode(page);
    await page.close();
  });

   test.beforeEach(async ({ page }) => {
    // Clean up any existing rules before each test
    await deleteAllRedirections(page);
     // Navigate back to redirection tab for rule creation
    await page.goto('/wp-admin/admin.php?page=maki-geo');
    await page.getByRole('button', { name: 'Geo redirection' }).click();
  });

  test.afterEach(async ({ page }) => {
    // Clean up rules after each test
    await deleteAllRedirections(page);
  });

  // --- Test cases will be added below ---

});
