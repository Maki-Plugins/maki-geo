import { test, expect } from "@playwright/test";
import { logIn } from "./playwright-utils";

test("can log in", async ({ page }) => {
  await logIn({ page });
  await expect(page).toHaveTitle(/Maki Geo/);
});
