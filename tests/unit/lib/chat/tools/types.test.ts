import { describe, it, expect } from "vitest";
import { Type } from "typebox";
import type { KbTool } from "@/lib/chat/tools/types";

const emptyParams = Type.Object({});

describe("KbTool.execute contract", () => {
  it("receives ctx with toolCallId when invoked by an adapter", async () => {
    let observed: { toolCallId: string } | undefined;

    const tool: KbTool<typeof emptyParams> = {
      name: "noop",
      description: "noop",
      parameters: emptyParams,
      execute: async (_args, ctx) => {
        observed = ctx;
        return { ok: true };
      },
    };

    await tool.execute({}, { toolCallId: "toolu_abc123" });
    expect(observed).toEqual({ toolCallId: "toolu_abc123" });
  });

  it("allows execute to ignore ctx (back-compat with KB read tools)", async () => {
    const tool: KbTool<typeof emptyParams> = {
      name: "ignores-ctx",
      description: "doesn't use ctx",
      parameters: emptyParams,
      execute: async (_args) => {
        return { ok: true };
      },
    };

    // Calling without ctx must still type-check and resolve.
    const result = await tool.execute({});
    expect(result).toEqual({ ok: true });
  });
});
