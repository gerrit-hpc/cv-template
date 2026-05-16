import { describe, it, expect } from "vitest";
import { getMode } from "@/lib/chat/modes";
import { tailorMode } from "@/lib/chat/modes/tailor";
import type { KbTool } from "@/lib/chat/tools/types";

const stubTool = (name: string): KbTool => ({
  name,
  description: "",
  parameters: {} as never,
  execute: async () => null,
});

describe("tailor mode", () => {
  it("is registered under id 'tailor'", () => {
    expect(getMode("tailor")).toBe(tailorMode);
  });

  it("has a system prompt instructing the KB-first, propose-once flow", () => {
    const p = tailorMode.systemPrompt;
    expect(p).toMatch(/knowledge base|kb tools|profile.*experience|skills/i);
    expect(p).toMatch(/propose_tailoring_strategy/);
    expect(p).toMatch(/end your turn|do not call additional tools/i);
    expect(p).toMatch(/do not fabricate|do not invent/i);
  });

  it("filter keeps the seven allowed tools and drops everything else", () => {
    const all: KbTool[] = [
      stubTool("get_profile"),
      stubTool("list_experience"),
      stubTool("get_experience_detail"),
      stubTool("list_skills"),
      stubTool("get_education"),
      stubTool("get_values"),
      stubTool("propose_tailoring_strategy"),
      stubTool("update_company_notes"),
      stubTool("save_brief"),
    ];
    const filtered = tailorMode.filterTools(all);
    expect(filtered.map((t) => t.name).sort()).toEqual([
      "get_education",
      "get_experience_detail",
      "get_profile",
      "get_values",
      "list_experience",
      "list_skills",
      "propose_tailoring_strategy",
    ]);
  });

  it("filter is idempotent on already-filtered input", () => {
    const all: KbTool[] = [stubTool("get_profile")];
    expect(tailorMode.filterTools(all)).toEqual(all);
  });
});
