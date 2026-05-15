import { z } from "zod";
import { Slug } from "@/server/validation/common";

export const ApplicationSchema = z.object({
  id: z.number().optional(),
  slug: Slug,
  company: z.string().min(1, "Company is required"),
  roleTitle: z.string().min(1, "Role title is required"),
  language: z.enum(["en", "de"]),
  status: z.enum(["drafting", "applied", "interviewing", "offer", "closed"]).default("drafting"),
});

export const JobDescriptionSchema = z.object({
  sourceType: z.enum(["url", "path", "pasted"]),
  sourceValue: z.string().optional().nullable(),
  capturedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "ISO date").optional(),
  content: z.string().min(1, "Content is required"),
});

export const TailoringStrategyContentSchema = z.object({
  jdSummary: z.object({
    mustHaves: z.array(z.string()),
    niceToHaves: z.array(z.string()),
    signals: z.array(z.string()),
    ambiguities: z.array(z.string()),
  }),
  strategy: z.object({
    headlineSummary: z.string(),
    experienceOrder: z.array(
      z.object({
        roleSlug: z.string(),
        leadAchievements: z.array(z.string()),
        dropAchievements: z.array(z.string()),
      }),
    ),
    skillsLead: z.array(z.string()),
    skillsDeprioritize: z.array(z.string()),
    coverLetterAngle: z.object({
      hook: z.string(),
      body1: z.string(),
      body2: z.string(),
      close: z.string(),
    }),
  }),
  gaps: z.array(
    z.object({
      requirement: z.string(),
      optionA: z.string(),
      optionB: z.string(),
      recommendation: z.enum(["A", "B", "address-head-on"]),
    }),
  ),
});

const CalibrationStyle = z.enum([
  "structured-behavioral",
  "unstructured-conversational",
  "case-heavy",
  "coding-heavy",
  "culture-heavy",
  "mixed",
]);
const CalibrationDifficulty = z.enum([
  "junior-screen",
  "mid-rigorous",
  "staff-level-deep-dive",
  "leadership-fit",
  "hybrid",
]);
const CalibrationTone = z.enum(["formal", "casual", "startup-scrappy", "corporate"]);

export const CompanyNotesContentSchema = z.object({
  company: z.object({
    overview: z.string(),
    products: z.string(),
    recentSignals: z.string(),
    leadership: z.string(),
    reputation: z.string(),
  }),
  role: z.object({
    beyondJd: z.string(),
    whyRole: z.string(),
  }),
  process: z.object({
    stages: z.array(
      z.object({
        name: z.string(),
        format: z.string(),
        duration: z.string(),
        who: z.string(),
        date: z.string().nullable(),
        status: z.enum(["known", "unknown"]),
      }),
    ),
    peopleToMeet: z.array(
      z.object({ name: z.string(), title: z.string(), linkedinUrl: z.string().nullable() }),
    ),
    logistics: z.string(),
  }),
  calibration: z.object({
    style: CalibrationStyle,
    difficulty: CalibrationDifficulty,
    tone: CalibrationTone,
    justification: z.string(),
  }),
  riskAreas: z.string(),
});

export const InterviewPrepBriefContentSchema = z.object({
  stageContext: z.string(),
  anchorStories: z.array(
    z.object({
      name: z.string(),
      sourceRoleSlug: z.string(),
      covers: z.array(z.string()),
      star: z.object({
        situation: z.string(),
        task: z.string(),
        action: z.string(),
        result: z.string(),
      }),
      oneLineSummary: z.string(),
    }),
  ),
  questionClusters: z.array(
    z.object({
      name: z.string(),
      questions: z.array(z.object({ q: z.string(), howToAnswer: z.string() })),
    }),
  ),
  toughQuestions: z.string(),
  questionsToAsk: z.array(z.object({ question: z.string(), listenFor: z.string() })),
  logistics: z.string(),
});

export type ApplicationInput = z.infer<typeof ApplicationSchema>;
export type TailoringStrategyContent = z.infer<typeof TailoringStrategyContentSchema>;
export type CompanyNotesContent = z.infer<typeof CompanyNotesContentSchema>;
export type InterviewPrepBriefContent = z.infer<typeof InterviewPrepBriefContentSchema>;
