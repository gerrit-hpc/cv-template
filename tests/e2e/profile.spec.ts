import { test, expect } from "@playwright/test";
import { resetDatabase } from "./helpers";

test.beforeAll(() => resetDatabase());

test("create + edit profile", async ({ page }) => {
  await page.goto("/profile");
  await page.getByLabel("Full name").fill("Jane Doe");
  await page.getByLabel("Headline").fill("Engineer");
  await page.getByLabel("Email").fill("j@d.com");
  await page.getByLabel("Professional summary").fill("Ten years of platforms.");
  await page.getByRole("button", { name: "Save" }).first().click();
  await page.reload();
  await expect(page.getByLabel("Full name")).toHaveValue("Jane Doe");
});
