import { test, expect } from "@playwright/test";
import { resetDatabase } from "./helpers";

test.beforeAll(() => resetDatabase());

test("save a principle", async ({ page }) => {
  await page.goto("/values");
  await page.getByRole("button", { name: "Add principle" }).click();
  await page.getByPlaceholder("Statement").fill("Ownership");
  await page.getByPlaceholder("Justification").fill("Because.");
  await page.getByRole("button", { name: "Save" }).first().click();
  await page.reload();
  await expect(page.getByPlaceholder("Statement")).toHaveValue("Ownership");
});
