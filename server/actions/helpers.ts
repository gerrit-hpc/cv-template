import type { ZodError } from "zod";

export function zodToFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

const COMPANY_SUFFIXES = new Set([
  "gmbh",
  "inc",
  "llc",
  "ltd",
  "corp",
  "ag",
  "sa",
  "bv",
  "nv",
  "plc",
  "pty",
  "co",
]);

export function slugify(...parts: string[]): string {
  return parts
    .map((s) =>
      s
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .split("-")
        .filter((word) => !COMPANY_SUFFIXES.has(word))
        .join("-"),
    )
    .filter(Boolean)
    .join("-");
}
