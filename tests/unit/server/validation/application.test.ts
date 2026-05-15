import { describe, it, expect } from "vitest";
import {
  ApplicationSchema,
  JobDescriptionSchema,
  TailoringStrategyContentSchema,
  CompanyNotesContentSchema,
  InterviewPrepBriefContentSchema,
} from "@/server/validation/application";

describe("Application schemas", () => {
  it("ApplicationSchema requires slug + company + roleTitle + language", () => {
    const r = ApplicationSchema.safeParse({});
    if (r.success) throw new Error("expected failure");
    const fe = r.error.flatten().fieldErrors;
    expect(fe.slug).toBeDefined();
    expect(fe.company).toBeDefined();
    expect(fe.roleTitle).toBeDefined();
    expect(fe.language).toBeDefined();
  });
  it("language must be en or de", () => {
    expect(() => ApplicationSchema.parse({ slug: "x", company: "c", roleTitle: "r", language: "fr" })).toThrow();
    expect(ApplicationSchema.parse({ slug: "x", company: "c", roleTitle: "r", language: "en" }).language).toBe("en");
  });
  it("JobDescriptionSchema requires sourceType + content", () => {
    const r = JobDescriptionSchema.safeParse({});
    if (r.success) throw new Error();
    expect(r.error.flatten().fieldErrors.sourceType).toBeDefined();
  });
  it("TailoringStrategyContentSchema accepts minimal valid input", () => {
    const v = TailoringStrategyContentSchema.parse({
      jdSummary: { mustHaves: [], niceToHaves: [], signals: [], ambiguities: [] },
      strategy: {
        headlineSummary: "x",
        experienceOrder: [],
        skillsLead: [],
        skillsDeprioritize: [],
        coverLetterAngle: { hook: "h", body1: "b", body2: "b", close: "c" },
      },
      gaps: [],
    });
    expect(v.gaps).toEqual([]);
  });
  it("CompanyNotesContentSchema requires calibration bands", () => {
    expect(() => CompanyNotesContentSchema.parse({ company: {}, role: {}, process: {}, calibration: {} })).toThrow();
  });
  it("InterviewPrepBriefContentSchema accepts minimal input", () => {
    const v = InterviewPrepBriefContentSchema.parse({
      stageContext: "x",
      anchorStories: [],
      questionClusters: [],
      toughQuestions: "",
      questionsToAsk: [],
      logistics: "",
    });
    expect(v.anchorStories).toEqual([]);
  });
});
