import { test, expect } from "@playwright/test";
import { resetDatabase } from "./helpers";

test.beforeAll(() => resetDatabase());

test("add a skill to a seeded category", async ({ page }) => {
  await page.goto("/skills");
  await page.getByText("Languages").first();
  await page.getByRole("button", { name: "Add skill" }).first().click();
  await page.getByPlaceholder("Skill name").fill("TypeScript");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("TypeScript").first()).toBeVisible();
});
