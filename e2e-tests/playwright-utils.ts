import { Page } from "@playwright/test";

export async function logIn({ page }: { page: Page }) {
  await page.goto("/wp-admin");
  await page.getByLabel("Username or Email Address").fill("admin");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Log In" }).click();
  await page.getByRole("link", { name: "Maki Geo", exact: true }).click();
}
