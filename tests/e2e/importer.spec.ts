import { test, expect } from "@playwright/test";
import { resetDatabase } from "./helpers";

test.beforeAll(() => resetDatabase());

test("run importer from Settings", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("Repo path (or set KB_SOURCE_REPO_PATH)").fill("test-fixtures/cv-template-minimal");
  await page.getByRole("button", { name: "Run importer" }).click();
  await expect(page.getByText(/Last import: success|partial/)).toBeVisible({ timeout: 30_000 });
  await page.goto("/profile");
  await expect(page.getByLabel("Full name")).toHaveValue("Jane Doe");
});
