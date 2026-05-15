import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { resetDatabase } from "./helpers";

test.beforeAll(() => resetDatabase());

const SURFACES = ["/profile", "/experience", "/skills", "/education", "/values", "/applications", "/settings"];

for (const path of SURFACES) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect.soft(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}
