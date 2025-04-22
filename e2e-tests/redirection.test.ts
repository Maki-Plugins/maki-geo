import { test, expect } from "@playwright/test";
import { logIn } from "./playwright-utils";

test.describe("Geo redirection", () => {
  test.beforeEach(async ({ page }) => {
    logIn({ page });
  });

  test("can create and delete geo redirection", async ({ page }) => {
    const redirectionName = "Test geo redirection";
    await page.getByRole("button", { name: " Geo redirection" }).click();
    await page.getByRole("button", { name: " Add new redirection" }).click();
    await page.getByLabel("Geo Redirect Name").fill(redirectionName);
    await page
      .getByRole("textbox", { name: "Country or country code" })
      .fill("Afghanistan");
    await page
      .getByLabel("Redirect URL")
      .fill("http://localhost:8888/redirection-success");
    await page.getByRole("button", { name: "Create Redirection" }).click();
    await expect(
      page.getByRole("heading", { name: redirectionName }).first(),
    ).toBeVisible();
    // Delete
    page.on("dialog", async (dialog) => {
      // Message will be "Are you sure you want to delete this redirection?"
      await dialog.accept();
    });
    await page.getByTestId("mgeo_delete_redirection").first().click();
  });

  test("can edit redirection", async ({ page }) => {
    const redirectionName = "Test geo redirection";
    await page.getByRole("button", { name: " Geo redirection" }).click();
    await page.getByRole("button", { name: " Add new redirection" }).click();
    await page.getByLabel("Geo Redirect Name").fill(redirectionName);
    await page
      .getByRole("textbox", { name: "Country or country code" })
      .fill("Afghanistan");
    await page
      .getByLabel("Redirect URL")
      .fill("http://localhost:8888/redirection-success");
    await page.getByRole("button", { name: "Create Redirection" }).click();
    await expect(
      page.getByRole("heading", { name: redirectionName }).first(),
    ).toBeVisible();
    const changedRedirectionName = "Changed Geo Redirect Name";
    await page.getByTestId("mgeo_edit_redirection").first().click();
    await page.getByLabel("Geo Redirect Name").fill(changedRedirectionName);
    await page.getByRole("button", { name: "Update Redirection" }).click();
    await expect(
      page.getByRole("heading", { name: changedRedirectionName }).first(),
    ).toBeVisible();
    // Delete
    page.on("dialog", async (dialog) => {
      // Message will be "Are you sure you want to delete this redirection?"
      await dialog.accept();
    });
    await page.getByTestId("mgeo_delete_redirection").first().click();
  });

  test("can create redirection with multiple locations", async ({ page }) => {
    const redirectionName = "Multi-Location Redirect";
    await page.getByRole("button", { name: " Geo redirection" }).click();
    await page.getByRole("button", { name: " Add new redirection" }).click();
    await page.getByLabel("Geo Redirect Name").fill(redirectionName);

    // Location 1: US
    const location1 = page.locator(".card-body").filter({ hasText: "Location 1" });
    await location1.locator('input[placeholder*="Country"]').fill("United States");
    await page.getByText("United States", { exact: true }).click();
    await location1.getByLabel("Redirect URL").fill("https://us.example.com");

    // Add Location 2: Canada
    await page.getByRole("button", { name: "Add Location" }).click();
    const location2 = page.locator(".card-body").filter({ hasText: "Location 2" });
    // Expand Location 2 (it might not auto-expand)
    if (!(await location2.locator('input[placeholder*="Country"]').isVisible())) {
      await location2.locator('.flex.items-center.gap-4.cursor-pointer').click();
    }
    await location2.locator('input[placeholder*="Country"]').fill("Canada");
    await page.getByText("Canada", { exact: true }).click();
    await location2.getByLabel("Redirect URL").fill("https://ca.example.com");

    // Save
    await page.getByRole("button", { name: "Create Redirection" }).click();
    await expect(page.getByRole("heading", { name: redirectionName })).toBeVisible();

    // Verify after edit
    await page.getByTestId("mgeo_edit_redirection").first().click();
    await expect(page.locator(".card-body").filter({ hasText: "Location 1" })).toBeVisible();
    await expect(page.locator(".card-body").filter({ hasText: "Location 2" })).toBeVisible();
    // Check values in expanded view
    const loc1Edit = page.locator(".card-body").filter({ hasText: "Location 1" });
    await expect(loc1Edit.locator('input[placeholder*="Country"]')).toHaveValue("United States");
    await expect(loc1Edit.getByLabel("Redirect URL")).toHaveValue("https://us.example.com");
    const loc2Edit = page.locator(".card-body").filter({ hasText: "Location 2" });
    // Expand Location 2 if needed
     if (!(await loc2Edit.locator('input[placeholder*="Country"]').isVisible())) {
      await loc2Edit.locator('.flex.items-center.gap-4.cursor-pointer').click();
    }
    await expect(loc2Edit.locator('input[placeholder*="Country"]')).toHaveValue("Canada");
    await expect(loc2Edit.getByLabel("Redirect URL")).toHaveValue("https://ca.example.com");

    // Delete
    page.on("dialog", async (dialog) => { await dialog.accept(); });
    await page.getByTestId("mgeo_delete_redirection").first().click();
  });

  test("can create redirection with multiple conditions (AND/OR)", async ({ page }) => {
    const redirectionName = "Multi-Condition Redirect";
    await page.getByRole("button", { name: " Geo redirection" }).click();
    await page.getByRole("button", { name: " Add new redirection" }).click();
    await page.getByLabel("Geo Redirect Name").fill(redirectionName);

    const location1 = page.locator(".card-body").filter({ hasText: "Location 1" });

    // Condition 1: Country IS US
    await location1.locator('input[placeholder*="Country"]').fill("United States");
    await page.getByText("United States", { exact: true }).click();

    // Add Condition 2: Region IS California
    await location1.getByRole("button", { name: "Add Condition" }).click();
    const condition2 = location1.locator(".geo-condition").filter({ hasText: "Condition 2" });
    await condition2.locator("select").first().selectOption("region"); // Select 'Region' type
    await condition2.locator('input[placeholder*="Region"]').fill("California");
    await page.getByText("California", { exact: true }).click();

    // Change operator to AND
    await location1.locator('button:has-text("OR")').click(); // Click the OR button
    await location1.locator('button:has-text("AND")').click(); // Click the AND button

    await location1.getByLabel("Redirect URL").fill("https://us-ca.example.com");

    // Save
    await page.getByRole("button", { name: "Create Redirection" }).click();
    await expect(page.getByRole("heading", { name: redirectionName })).toBeVisible();

    // Verify after edit
    await page.getByTestId("mgeo_edit_redirection").first().click();
    const locEdit = page.locator(".card-body").filter({ hasText: "Location 1" });
    await expect(locEdit.locator(".geo-condition").nth(0).locator('input[placeholder*="Country"]')).toHaveValue("United States");
    await expect(locEdit.locator(".geo-condition").nth(1).locator('input[placeholder*="Region"]')).toHaveValue("California");
    await expect(locEdit.locator('button.btn-active:has-text("AND")')).toBeVisible(); // Check AND is active
    await expect(locEdit.getByLabel("Redirect URL")).toHaveValue("https://us-ca.example.com");

    // Delete
    page.on("dialog", async (dialog) => { await dialog.accept(); });
    await page.getByTestId("mgeo_delete_redirection").first().click();
  });

  test("can create redirection with specific page targeting and mappings", async ({ page }) => {
    const redirectionName = "Specific Page Redirect";
    await page.getByRole("button", { name: " Geo redirection" }).click();
    await page.getByRole("button", { name: " Add new redirection" }).click();
    await page.getByLabel("Geo Redirect Name").fill(redirectionName);

    const location1 = page.locator(".card-body").filter({ hasText: "Location 1" });
    await location1.locator('input[placeholder*="Country"]').fill("Germany");
    await page.getByText("Germany", { exact: true }).click();

    // Change to Specific pages
    await location1.locator('input[type="radio"][value="specific"]').click();

    // Add Mapping 1
    await location1.getByRole("button", { name: "Add URL Mapping" }).click();
    const mapping1 = location1.locator(".join").filter({ hasText: "From URL Path" }).nth(0);
    await mapping1.locator('input[placeholder*="From URL Path"]').fill("/about");
    await mapping1.locator('input[placeholder*="To URL"]').fill("https://de.example.com/ueber-uns");

    // Add Mapping 2
    await location1.getByRole("button", { name: "Add URL Mapping" }).click();
    const mapping2 = location1.locator(".join").filter({ hasText: "From URL Path" }).nth(1);
    await mapping2.locator('input[placeholder*="From URL Path"]').fill("/contact");
    await mapping2.locator('input[placeholder*="To URL"]').fill("https://de.example.com/kontakt");

    // Save
    await page.getByRole("button", { name: "Create Redirection" }).click();
    await expect(page.getByRole("heading", { name: redirectionName })).toBeVisible();

    // Verify after edit
    await page.getByTestId("mgeo_edit_redirection").first().click();
    const locEdit = page.locator(".card-body").filter({ hasText: "Location 1" });
    await expect(locEdit.locator('input[type="radio"][value="specific"]')).toBeChecked();
    const map1Edit = locEdit.locator(".join").filter({ hasText: "From URL Path" }).nth(0);
    await expect(map1Edit.locator('input[placeholder*="From URL Path"]')).toHaveValue("/about");
    await expect(map1Edit.locator('input[placeholder*="To URL"]')).toHaveValue("https://de.example.com/ueber-uns");
    const map2Edit = locEdit.locator(".join").filter({ hasText: "From URL Path" }).nth(1);
    await expect(map2Edit.locator('input[placeholder*="From URL Path"]')).toHaveValue("/contact");
    await expect(map2Edit.locator('input[placeholder*="To URL"]')).toHaveValue("https://de.example.com/kontakt");

    // Delete
    page.on("dialog", async (dialog) => { await dialog.accept(); });
    await page.getByTestId("mgeo_delete_redirection").first().click();
  });

   test("can create redirection with exclusions", async ({ page }) => {
    const redirectionName = "Redirect with Exclusions";
    await page.getByRole("button", { name: " Geo redirection" }).click();
    await page.getByRole("button", { name: " Add new redirection" }).click();
    await page.getByLabel("Geo Redirect Name").fill(redirectionName);

    const location1 = page.locator(".card-body").filter({ hasText: "Location 1" });
    await location1.locator('input[placeholder*="Country"]').fill("France");
    await page.getByText("France", { exact: true }).click();
    await location1.getByLabel("Redirect URL").fill("https://fr.example.com");

    // Add Exclusion 1: URL Path equals /admin
    await location1.getByRole("button", { name: "Add Exclusion" }).click();
    const exclusion1 = location1.locator(".join").filter({ hasText: "Value to exclude" }).nth(0);
    await exclusion1.locator("select").selectOption("url_equals");
    await exclusion1.locator('input[placeholder="Value to exclude"]').fill("/admin");

    // Add Exclusion 2: Query contains no_redirect=true
    await location1.getByRole("button", { name: "Add Exclusion" }).click();
    const exclusion2 = location1.locator(".join").filter({ hasText: "Value to exclude" }).nth(1);
    await exclusion2.locator("select").selectOption("query_contains");
    await exclusion2.locator('input[placeholder="Value to exclude"]').fill("no_redirect=true");

    // Save
    await page.getByRole("button", { name: "Create Redirection" }).click();
    await expect(page.getByRole("heading", { name: redirectionName })).toBeVisible();

    // Verify after edit
    await page.getByTestId("mgeo_edit_redirection").first().click();
    const locEdit = page.locator(".card-body").filter({ hasText: "Location 1" });
    const excl1Edit = locEdit.locator(".join").filter({ hasText: "Value to exclude" }).nth(0);
    await expect(excl1Edit.locator("select")).toHaveValue("url_equals");
    await expect(excl1Edit.locator('input[placeholder="Value to exclude"]')).toHaveValue("/admin");
    const excl2Edit = locEdit.locator(".join").filter({ hasText: "Value to exclude" }).nth(1);
    await expect(excl2Edit.locator("select")).toHaveValue("query_contains");
    await expect(excl2Edit.locator('input[placeholder="Value to exclude"]')).toHaveValue("no_redirect=true");

    // Delete
    page.on("dialog", async (dialog) => { await dialog.accept(); });
    await page.getByTestId("mgeo_delete_redirection").first().click();
  });

  test("can create redirection with passPath/passQuery disabled", async ({ page }) => {
    const redirectionName = "No Pass-Through Redirect";
    await page.getByRole("button", { name: " Geo redirection" }).click();
    await page.getByRole("button", { name: " Add new redirection" }).click();
    await page.getByLabel("Geo Redirect Name").fill(redirectionName);

    const location1 = page.locator(".card-body").filter({ hasText: "Location 1" });
    await location1.locator('input[placeholder*="Country"]').fill("Brazil");
    await page.getByText("Brazil", { exact: true }).click();
    await location1.getByLabel("Redirect URL").fill("https://br.example.com");

    // Disable passPath and passQuery (they are enabled by default)
    await location1.locator('input[type="checkbox"]').near(page.getByText('Pass page path')).click();
    await location1.locator('input[type="checkbox"]').near(page.getByText('Pass query string')).click();

    // Save
    await page.getByRole("button", { name: "Create Redirection" }).click();
    await expect(page.getByRole("heading", { name: redirectionName })).toBeVisible();

    // Verify after edit
    await page.getByTestId("mgeo_edit_redirection").first().click();
    const locEdit = page.locator(".card-body").filter({ hasText: "Location 1" });
    await expect(locEdit.locator('input[type="checkbox"]').near(page.getByText('Pass page path'))).not.toBeChecked();
    await expect(locEdit.locator('input[type="checkbox"]').near(page.getByText('Pass query string'))).not.toBeChecked();

    // Delete
    page.on("dialog", async (dialog) => { await dialog.accept(); });
    await page.getByTestId("mgeo_delete_redirection").first().click();
  });

  test("can enable and disable redirection", async ({ page }) => {
    const redirectionName = "Toggle Active Redirect";
    await page.getByRole("button", { name: " Geo redirection" }).click();
    await page.getByRole("button", { name: " Add new redirection" }).click();
    await page.getByLabel("Geo Redirect Name").fill(redirectionName);
    await page.locator('input[placeholder*="Country"]').fill("Japan");
    await page.getByText("Japan", { exact: true }).click();
    await page.getByLabel("Redirect URL").fill("https://jp.example.com");

    // Save (should be enabled by default)
    await page.getByRole("button", { name: "Create Redirection" }).click();
    const ruleCard = page.locator(".card").filter({ hasText: redirectionName });
    await expect(ruleCard.locator('.badge:has-text("Enabled")')).toBeVisible();

    // Disable
    await page.getByTestId("mgeo_edit_redirection").first().click();
    await page.locator('input[type="checkbox"]').near(page.getByText('Active')).click(); // Click the toggle
    await page.getByRole("button", { name: "Update Redirection" }).click();
    await expect(ruleCard.locator('.badge:has-text("Disabled")')).toBeVisible();

    // Re-enable
    await page.getByTestId("mgeo_edit_redirection").first().click();
    await page.locator('input[type="checkbox"]').near(page.getByText('Active')).click(); // Click the toggle again
    await page.getByRole("button", { name: "Update Redirection" }).click();
    await expect(ruleCard.locator('.badge:has-text("Enabled")')).toBeVisible();

    // Delete
    page.on("dialog", async (dialog) => { await dialog.accept(); });
    await page.getByTestId("mgeo_delete_redirection").first().click();
  });
});
