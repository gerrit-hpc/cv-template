import { z } from "zod";

export const Slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Must be lowercase kebab-case");
export const TagSlug = Slug;
export const YearMonth = z.union([z.string().regex(/^\d{4}-\d{2}$/, "YYYY-MM"), z.literal("present")]);
