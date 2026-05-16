import { describe, it, expect } from "vitest";
import { getMode } from "@/lib/chat/modes";

describe("mode registry", () => {
  it("returns null for an unknown mode id", () => {
    expect(getMode("not-a-mode")).toBeNull();
  });
});
