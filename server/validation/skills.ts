import { z } from "zod";
import { TagSlug } from "@/server/validation/common";

export const SkillCategorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  order: z.number().int().nonnegative(),
});

export const SkillSchema = z.object({
  id: z.number().optional(),
  categoryId: z.number().int().positive(),
  name: z.string().min(1, "Name is required"),
  proficiency: z.enum(["familiar", "proficient", "expert"]),
  notes: z.string().optional().nullable(),
  order: z.number().int().nonnegative(),
});

export const SoftSkillSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  whereDemonstrated: z.string().min(1, "Required"),
  whatHappened: z.string().min(1, "Required"),
  order: z.number().int().nonnegative(),
  tagSlugs: z.array(TagSlug).default([]),
});

export type SkillCategoryInput = z.infer<typeof SkillCategorySchema>;
export type SkillInput = z.infer<typeof SkillSchema>;
export type SoftSkillInput = z.infer<typeof SoftSkillSchema>;
