import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindMany = vi.fn();

vi.mock("@/server/data/db", () => ({
  db: {
    educationEntry: { findMany: mockFindMany },
  },
}));

describe("makeGetEducationTool", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("scopes query to userId", async () => {
    mockFindMany.mockResolvedValue([]);
    const { makeGetEducationTool } = await import("@/lib/chat/tools/kb/get-education");
    const tool = makeGetEducationTool(1);
    await tool.execute({});
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 1 } }),
    );
  });

  it("orders by order asc", async () => {
    mockFindMany.mockResolvedValue([]);
    const { makeGetEducationTool } = await import("@/lib/chat/tools/kb/get-education");
    const tool = makeGetEducationTool(1);
    await tool.execute({});
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { order: "asc" } }),
    );
  });

  it("returns mapped education entries", async () => {
    mockFindMany.mockResolvedValue([
      {
        kind: "degree",
        institution: "TU Berlin",
        name: "B.Sc. Computer Science",
        field: "Computer Science",
        startDate: "2016",
        endDate: "2020",
        notes: null,
      },
    ]);
    const { makeGetEducationTool } = await import("@/lib/chat/tools/kb/get-education");
    const tool = makeGetEducationTool(1);
    const result = await tool.execute({}) as { entries: unknown[] };
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toEqual({
      kind: "degree",
      institution: "TU Berlin",
      name: "B.Sc. Computer Science",
      field: "Computer Science",
      startDate: "2016",
      endDate: "2020",
      notes: null,
    });
  });
});
