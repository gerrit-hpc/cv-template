import { z } from "zod";

export const PrincipleSchema = z.object({
  id: z.number().optional(),
  statement: z.string().min(1, "Statement is required"),
  justification: z.string().min(1, "Justification is required"),
  order: z.number().int().nonnegative(),
});

export const CareerNarrativeSchema = z.object({
  text: z.string().min(1, "Narrative is required"),
});

export const IndustryOpinionSchema = z.object({
  id: z.number().optional(),
  position: z.string().min(1, "Position is required"),
  why: z.string().min(1, "Why is required"),
  counterargument: z.string().min(1, "Counterargument is required"),
  order: z.number().int().nonnegative(),
});

export const LinkedInThemeSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(1, "Text is required"),
  order: z.number().int().nonnegative(),
});

export type PrincipleInput = z.infer<typeof PrincipleSchema>;
export type CareerNarrativeInput = z.infer<typeof CareerNarrativeSchema>;
export type IndustryOpinionInput = z.infer<typeof IndustryOpinionSchema>;
export type LinkedInThemeInput = z.infer<typeof LinkedInThemeSchema>;
