import { z } from "zod";

export const EducationEntrySchema = z.object({
  id: z.number().optional(),
  kind: z.enum(["degree", "certification", "course"]),
  institution: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required"),
  field: z.string().optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}$/).optional().nullable().or(z.literal("")),
  endDate: z.string().regex(/^\d{4}-\d{2}$/).optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable(),
  order: z.number().int().nonnegative(),
});

export type EducationEntryInput = z.infer<typeof EducationEntrySchema>;
