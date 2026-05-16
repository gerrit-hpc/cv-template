import { test, expect } from "@playwright/test";
import { resetDatabase } from "./helpers";

test.beforeAll(() => resetDatabase());

test("chat pane: happy path with mocked SSE response", async ({ page }) => {
  // Create an application first
  await page.goto("/applications/new");
  await page.getByLabel("Company").fill("TestCo");
  await page.getByLabel("Role title").fill("Engineer");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/applications\/testco-engineer/);

  // Intercept the chat API with a mock SSE stream
  await page.route("/api/chat/testco-engineer", async (route) => {
    const events = [
      { type: "text_delta", text: "Hello" },
      { type: "text_delta", text: ", world" },
      { type: "text_delta", text: "!" },
      { type: "done", finishReason: "end_turn" },
    ];
    const body = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body,
    });
  });

  // Type a message and submit
  const textarea = page.getByRole("textbox", { name: "Message input" });
  await textarea.fill("Tell me about this company");
  await page.getByRole("button", { name: "Send" }).click();

  // User bubble should appear optimistically
  await expect(page.getByText("Tell me about this company")).toBeVisible();

  // Assistant response should stream in and be visible
  await expect(page.getByText("Hello, world!")).toBeVisible();
});

test("chat pane: send button disabled for empty input", async ({ page }) => {
  await page.goto("/applications/testco-engineer");
  const sendButton = page.getByRole("button", { name: "Send" });
  await expect(sendButton).toBeDisabled();
  await page.getByRole("textbox", { name: "Message input" }).fill("  ");
  await expect(sendButton).toBeDisabled();
});
