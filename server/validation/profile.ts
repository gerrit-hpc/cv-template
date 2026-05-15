import { z } from "zod";

export const ProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  headline: z.string().min(1, "Headline is required"),
  locationCity: z.string().optional().nullable(),
  locationCountry: z.string().optional().nullable(),
  // z.string().email() in Zod 4 rejects single-char domain segments (e.g. a@b.c).
  // Use a permissive regex that still rejects non-emails while accepting short TLDs.
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Valid email required"),
  phone: z.string().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal("")),
  githubUrl: z.string().url().optional().nullable().or(z.literal("")),
  websiteUrl: z.string().url().optional().nullable().or(z.literal("")),
  professionalSummary: z.string().min(1, "Summary is required"),
});

export type ProfileInput = z.infer<typeof ProfileSchema>;

export const KeyQualificationSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(1, "Text is required"),
  order: z.number().int().nonnegative(),
});

export const LanguageSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  proficiency: z.string().min(1, "Proficiency is required"),
  order: z.number().int().nonnegative(),
});

export type KeyQualificationInput = z.infer<typeof KeyQualificationSchema>;
export type LanguageInput = z.infer<typeof LanguageSchema>;
