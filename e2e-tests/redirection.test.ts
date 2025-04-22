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
});
