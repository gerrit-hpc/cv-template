import { test, expect } from "@playwright/test";
import { resetDatabase } from "./helpers";

test.beforeAll(() => resetDatabase());

test("create application", async ({ page }) => {
  await page.goto("/applications/new");
  await page.getByLabel("Company").fill("Acme");
  await page.getByLabel("Role title").fill("Engineer");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/applications\/acme-engineer/);
});
