import { z } from "zod";
import { Slug, TagSlug } from "@/server/validation/common";

export const ExperienceRoleSchema = z.object({
  id: z.number().optional(),
  slug: Slug,
  company: z.string().min(1, "Company is required"),
  title: z.string().min(1, "Title is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, "YYYY-MM"),
  endDate: z.union([z.string().regex(/^\d{4}-\d{2}$/), z.null(), z.literal("")]).transform((v) => (v ? v : null)),
  location: z.string().optional().nullable(),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship"]),
  companyUrl: z.string().url().optional().nullable().or(z.literal("")),
  overview: z.string().min(1, "Overview is required"),
  scopeTeamSize: z.string().optional().nullable(),
  scopeReportingTo: z.string().optional().nullable(),
  scopeTechStack: z.string().optional().nullable(),
  scopeBudget: z.string().optional().nullable(),
  isHighlightsOnly: z.boolean().default(false),
  tagSlugs: z.array(TagSlug).default([]),
});

export const AchievementSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Title is required"),
  result: z.string().min(1, "Result is required"),
  context: z.string().min(1, "Context is required"),
  action: z.string().min(1, "Action is required"),
  order: z.number().int().nonnegative(),
  tagSlugs: z.array(TagSlug).default([]),
});

export const HighlightSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(1, "Text is required"),
  order: z.number().int().nonnegative(),
});

export type ExperienceRoleInput = z.infer<typeof ExperienceRoleSchema>;
export type AchievementInput = z.infer<typeof AchievementSchema>;
export type HighlightInput = z.infer<typeof HighlightSchema>;
