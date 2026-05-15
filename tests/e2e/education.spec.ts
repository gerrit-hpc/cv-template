import { test, expect } from "@playwright/test";
import { resetDatabase } from "./helpers";

test.beforeAll(() => resetDatabase());

test("add a degree", async ({ page }) => {
  await page.goto("/education/new");
  await page.getByLabel("Name").fill("MSc CS");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page).toHaveURL(/\/education$/);
  await expect(page.getByText("MSc CS")).toBeVisible();
});
