import { test, expect } from "@playwright/test";
import { resetDatabase } from "./helpers";

test.beforeAll(() => resetDatabase());

test("create role + add achievement", async ({ page }) => {
  await page.goto("/experience/new");
  await page.getByLabel("Company").fill("Acme");
  await page.getByLabel("Title").fill("Engineer");
  await page.getByLabel("Start date").fill("2020-01");
  await page.getByLabel("Overview").fill("did things");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/experience\/acme-engineer/);
  await page.getByRole("button", { name: "Add achievement" }).click();
  await page.getByLabel("Title").fill("Shipped onboarding");
  await page.getByLabel("Context").fill("Manual checklist.");
  await page.getByLabel("Action").fill("Built pipeline.");
  await page.getByLabel("Result").fill("Cut time by 90%.");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Shipped onboarding")).toBeVisible();
});
