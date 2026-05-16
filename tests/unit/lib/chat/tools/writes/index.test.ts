import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/data/db", () => ({
  db: {
    application: { findFirst: vi.fn() },
    chatToolCall: { create: vi.fn() },
  },
}));

describe("buildWriteTools", () => {
  it("returns the three write tools with the expected names", async () => {
    const { buildWriteTools } = await import("@/lib/chat/tools/writes/index");
    const tools = buildWriteTools(42, 1);
    expect(tools.map((t) => t.name)).toEqual([
      "propose_tailoring_strategy",
      "update_company_notes",
      "save_brief",
    ]);
  });
});
