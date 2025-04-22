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

  // --- Test cases ---

  test("should redirect when API returns redirect: true", async ({ page }) => {
    const targetUrl = "http://localhost:8888/client-redirect-target/";
    const apiUrl = "**/maki-geo/v1/redirection";

    // Mock the API response
    await page.route(apiUrl, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { redirect: true, url: targetUrl },
      });
    });

    // Visit a frontend page
    await page.goto("/sample-page/");

    // Wait for the URL to change
    await page.waitForURL(targetUrl);

    // Assert the final URL
    expect(page.url()).toBe(targetUrl);

    // Assert sessionStorage flag
    const sessionStorageFlag = await page.evaluate(() =>
      window.sessionStorage.getItem("mgeo_redirected"),
    );
    expect(sessionStorageFlag).toBe("1");

    // Clean up route handler
    await page.unroute(apiUrl);
  });

  test("should not redirect when API returns redirect: false", async ({ page }) => {
    const apiUrl = "**/maki-geo/v1/redirection";
    const originalUrl = "http://localhost:8888/sample-page/";

    // Mock the API response
    await page.route(apiUrl, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { redirect: false },
      });
    });

    // Visit a frontend page
    await page.goto("/sample-page/");

    // Wait a bit to ensure no redirect happens
    await page.waitForTimeout(500);

    // Assert the URL hasn't changed
    expect(page.url()).toBe(originalUrl);

    // Assert sessionStorage flag is not set
    const sessionStorageFlag = await page.evaluate(() =>
      window.sessionStorage.getItem("mgeo_redirected"),
    );
    expect(sessionStorageFlag).toBeNull();

    // Clean up route handler
    await page.unroute(apiUrl);
  });

  test("should not redirect if sessionStorage flag is set", async ({ page }) => {
    const apiUrl = "**/maki-geo/v1/redirection";
    const originalUrl = "http://localhost:8888/sample-page/";
    let apiCalled = false;

    // Set sessionStorage flag before navigation
    await page.evaluate(() =>
      window.sessionStorage.setItem("mgeo_redirected", "1"),
    );

    // Mock the API route to fail the test if called
    await page.route(apiUrl, async (route) => {
      apiCalled = true;
      await route.abort(); // Abort the request
    });

    // Visit a frontend page
    await page.goto("/sample-page/");

    // Wait a bit
    await page.waitForTimeout(500);

    // Assert the URL hasn't changed
    expect(page.url()).toBe(originalUrl);

    // Assert API was not called
    expect(apiCalled).toBe(false);

    // Clean up route handler
    await page.unroute(apiUrl);
  });

  test("should handle API error gracefully", async ({ page }) => {
    const apiUrl = "**/maki-geo/v1/redirection";
    const originalUrl = "http://localhost:8888/sample-page/";
    let consoleErrors: string[] = [];

    // Listen for console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Mock the API route to fail
    await page.route(apiUrl, async (route) => {
      await route.abort();
    });

    // Visit a frontend page
    await page.goto("/sample-page/");

    // Wait a bit
    await page.waitForTimeout(500);

    // Assert the URL hasn't changed
    expect(page.url()).toBe(originalUrl);

    // Assert sessionStorage flag is not set
    const sessionStorageFlag = await page.evaluate(() =>
      window.sessionStorage.getItem("mgeo_redirected"),
    );
    expect(sessionStorageFlag).toBeNull();

    // Assert console error message
    expect(consoleErrors.some((msg) => msg.includes("Geo redirection error"))).toBe(true);

    // Clean up route handler and console listener
    await page.unroute(apiUrl);
    page.off("console", () => {});
  });

   test("should not redirect on admin pages", async ({ page }) => {
    const apiUrl = "**/maki-geo/v1/redirection";
    const adminUrl = "http://localhost:8888/wp-admin/";
    let apiCalled = false;

    // Mock the API route to see if it gets called
    await page.route(apiUrl, async (route) => {
      apiCalled = true;
      // Fulfill with a redirect just in case the script *did* run
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { redirect: true, url: "http://localhost:8888/should-not-go-here/" },
      });
    });

    // Visit an admin page (ensure logged in if necessary, though script shouldn't enqueue anyway)
    await logIn({ page }); // Log in first
    await page.goto(adminUrl);

    // Wait a bit
    await page.waitForTimeout(500);

    // Assert the URL is still the admin URL (or contains it)
    expect(page.url()).toContain(adminUrl);

    // Assert API was not called (because script shouldn't be enqueued/run)
    expect(apiCalled).toBe(false);

    // Clean up route handler
    await page.unroute(apiUrl);
  });
});
