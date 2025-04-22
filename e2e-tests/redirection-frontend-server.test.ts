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

  // --- Test cases ---

  test("should redirect based on forced location (passPath=T, passQuery=T)", async ({ page }) => {
    const ruleName = "US Redirect";
    const targetUrl = "http://localhost:8888/us-target/";
    await createRedirectionRule(page, ruleName, "United States", targetUrl, true, true);

    const originalPath = "/sample-page/";
    const originalQuery = "?force_location=US_CA&test=123";
    const originalHash = "#section";
    const visitUrl = `${originalPath}${originalQuery}${originalHash}`;

    await page.goto(visitUrl);

    // Expected URL: target base + original path + original query + original hash
    const expectedUrl = `${targetUrl.slice(0,-1)}${originalPath}${originalQuery}${originalHash}`; // Remove trailing slash from target, add path, query, hash
    await expect(page.url()).toBe(expectedUrl);
  });

  test("should redirect based on forced location (passPath=F, passQuery=T)", async ({ page }) => {
    const ruleName = "GB Redirect";
    const targetUrl = "http://localhost:8888/gb-target/";
    await createRedirectionRule(page, ruleName, "United Kingdom", targetUrl, false, true);

    const originalPath = "/another-page/";
    const originalQuery = "?force_location=GB&data=abc";
    const originalHash = "#hash";
    const visitUrl = `${originalPath}${originalQuery}${originalHash}`;

    await page.goto(visitUrl);

    // Expected URL: target base + original query + original hash (NO original path)
    const expectedUrl = `${targetUrl}${originalQuery}${originalHash}`;
    await expect(page.url()).toBe(expectedUrl);
  });

   test("should redirect based on forced location (passPath=T, passQuery=F)", async ({ page }) => {
    const ruleName = "DE Redirect";
    const targetUrl = "http://localhost:8888/de-target/";
    // Ensure 'DE' mock exists in src/api/location.php
    await createRedirectionRule(page, ruleName, "Germany", targetUrl, true, false);

    const originalPath = "/german-page/";
    const originalQuery = "?force_location=DE&lang=de";
    const originalHash = "#anker";
    const visitUrl = `${originalPath}${originalQuery}${originalHash}`;

    await page.goto(visitUrl);

    // Expected URL: target base + original path + original hash (NO original query)
    const expectedUrl = `${targetUrl.slice(0,-1)}${originalPath}${originalHash}`; // Remove trailing slash from target, add path, hash
    await expect(page.url()).toBe(expectedUrl);
  });

  test("should not redirect if location does not match", async ({ page }) => {
    const ruleName = "US Redirect Only";
    const targetUrl = "http://localhost:8888/us-target/";
    await createRedirectionRule(page, ruleName, "United States", targetUrl, true, true);

    const originalPath = "/sample-page/";
    const originalQuery = "?force_location=GB"; // Force GB, rule is for US
    const visitUrl = `${originalPath}${originalQuery}`;
    const expectedUrl = `http://localhost:8888${visitUrl}`; // Expect the original URL

    await page.goto(visitUrl);

    await expect(page.url()).toBe(expectedUrl);
  });

  test("should not redirect if URL is excluded", async ({ page }) => {
    const ruleName = "US Exclude";
    const targetUrl = "http://localhost:8888/us-target/";
    const excludedPath = "/excluded-page/";
    await createRedirectionRule(page, ruleName, "United States", targetUrl, true, true, [
        { type: 'URL Path equals', value: excludedPath }
    ]);

    // 1. Visit excluded page
    const excludedVisitUrl = `${excludedPath}?force_location=US_CA`;
    const expectedExcludedUrl = `http://localhost:8888${excludedVisitUrl}`;
    await page.goto(excludedVisitUrl);
    await expect(page.url()).toBe(expectedExcludedUrl); // Should NOT redirect

    // 2. Visit non-excluded page
    const nonExcludedPath = "/another-page/";
    const nonExcludedQuery = "?force_location=US_CA";
    const nonExcludedVisitUrl = `${nonExcludedPath}${nonExcludedQuery}`;
    const expectedRedirectUrl = `${targetUrl.slice(0,-1)}${nonExcludedPath}${nonExcludedQuery}`; // Should redirect
    await page.goto(nonExcludedVisitUrl);
    await expect(page.url()).toBe(expectedRedirectUrl);
  });

  test("should not redirect on admin pages", async ({ page }) => {
    const ruleName = "US Admin Redirect Attempt";
    const targetUrl = "http://localhost:8888/us-target/";
    await createRedirectionRule(page, ruleName, "United States", targetUrl, true, true);

    const adminPath = "/wp-admin/";
    const adminQuery = "?force_location=US_CA";
    const visitUrl = `${adminPath}${adminQuery}`;
    const expectedUrlPrefix = `http://localhost:8888${adminPath}`; // Expect to stay on wp-admin

    await page.goto(visitUrl);

    // Check that the URL starts with the admin path, it might add other query params
    await expect(page.url()).toContain(expectedUrlPrefix);
    // Ensure it didn't redirect to the target
    await expect(page.url()).not.toContain(targetUrl);
  });
});
