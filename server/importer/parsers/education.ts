import { splitSections } from "@/server/importer/md-utils";

type Entry = {
  kind: "degree" | "certification" | "course";
  institution: string | null;
  name: string;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  order: number;
};

function parseDateRange(s: string): { startDate: string | null; endDate: string | null } {
  // Handle "YYYY-YYYY" (year range, no months) vs "YYYY-MM" (single date with month)
  // vs "YYYY-MM-YYYY" or "YYYY - YYYY" etc.
  const yearRange = s.match(/(\d{4})\s*[-–—]\s*(\d{4})(?:-(\d{2}))?/);
  if (yearRange) {
    const startYear = yearRange[1]!;
    const endYear = yearRange[2]!;
    const endMonth = yearRange[3] ?? "12";
    return { startDate: `${startYear}-01`, endDate: `${endYear}-${endMonth}` };
  }
  const single = s.match(/(\d{4})(?:-(\d{2}))?/);
  if (!single) return { startDate: null, endDate: null };
  const startYear = single[1]!;
  const startMonth = single[2] ?? "01";
  return { startDate: `${startYear}-${startMonth}`, endDate: null };
}

function parseBulletLine(line: string, kind: Entry["kind"], order: number): Entry | null {
  const cleaned = line.replace(/^\s*-\s+/, "").trim();
  if (!cleaned) return null;
  const noteMatch = cleaned.match(/^(.+?),\s*"([^"]+)"$/);
  const base = noteMatch ? noteMatch[1]!.trim() : cleaned;
  const notes = noteMatch ? noteMatch[2]! : null;
  const parts = base.split(",").map((p) => p.trim());
  const name = parts[0] ?? "";
  const institution = parts[1] ?? null;
  const dateChunk = parts.slice(2).join(", ");
  const { startDate, endDate } = parseDateRange(dateChunk);
  return { kind, name, institution, field: null, startDate, endDate, notes, order };
}

export function parseEducation(source: string): Entry[] {
  const { sections } = splitSections(source);
  const out: Entry[] = [];
  for (const [heading, body] of Object.entries(sections)) {
    const kind: Entry["kind"] | null =
      heading.toLowerCase().includes("degree") ? "degree" :
      heading.toLowerCase().includes("certification") ? "certification" :
      heading.toLowerCase().includes("course") ? "course" :
      null;
    if (!kind) continue;
    const lines = body.split("\n").filter((l) => l.trim().startsWith("-"));
    lines.forEach((line, i) => {
      const e = parseBulletLine(line, kind, i);
      if (e) out.push(e);
    });
  }
  return out;
}
