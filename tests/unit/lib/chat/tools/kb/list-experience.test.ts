import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindMany = vi.fn();

vi.mock("@/server/data/db", () => ({
  db: {
    experienceRole: { findMany: mockFindMany },
  },
}));

describe("makeListExperienceTool", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("scopes query to userId", async () => {
    mockFindMany.mockResolvedValue([]);
    const { makeListExperienceTool } = await import("@/lib/chat/tools/kb/list-experience");
    const tool = makeListExperienceTool(1);
    await tool.execute({});
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 1 } }),
    );
  });

  it("orders by startDate desc", async () => {
    mockFindMany.mockResolvedValue([]);
    const { makeListExperienceTool } = await import("@/lib/chat/tools/kb/list-experience");
    const tool = makeListExperienceTool(1);
    await tool.execute({});
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { startDate: "desc" } }),
    );
  });

  it("returns roles with DTO fields only (no internal ids)", async () => {
    mockFindMany.mockResolvedValue([
      {
        slug: "acme-engineer",
        company: "Acme",
        title: "Engineer",
        startDate: "2020-01",
        endDate: "2023-06",
        location: "Berlin",
        employmentType: "full_time",
      },
    ]);
    const { makeListExperienceTool } = await import("@/lib/chat/tools/kb/list-experience");
    const tool = makeListExperienceTool(1);
    const result = await tool.execute({}) as { roles: unknown[] };
    expect(result.roles).toHaveLength(1);
    expect(result.roles[0]).toEqual({
      slug: "acme-engineer",
      company: "Acme",
      title: "Engineer",
      startDate: "2020-01",
      endDate: "2023-06",
      location: "Berlin",
      employmentType: "full_time",
    });
  });
});
