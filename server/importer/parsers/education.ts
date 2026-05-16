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

function parseDate(s: string): string | null {
  const m = s.match(/(\d{4})(?:-(\d{2}))?/);
  if (!m) return null;
  return `${m[1]}-${m[2] ?? "01"}`;
}

function parseCsvBullet(line: string, kind: Entry["kind"], order: number): Entry | null {
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

function splitH3Blocks(body: string): { title: string; body: string }[] {
  const lines = body.split("\n");
  const blocks: { title: string; body: string }[] = [];
  let current: { title: string; body: string } | null = null;
  for (const line of lines) {
    const m = line.match(/^###\s+(.+?)\s*$/);
    if (m) {
      if (current) blocks.push(current);
      current = { title: m[1]!, body: "" };
    } else if (current) {
      current.body += line + "\n";
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

function findLabeledBullet(body: string, label: string): string | null {
  const re = new RegExp(`^\\s*-\\s+\\*\\*${label}\\*\\*\\s*:\\s*(.+?)\\s*$`, "im");
  const m = body.match(re);
  return m ? m[1]!.trim() : null;
}

function parseH3Block(block: { title: string; body: string }, kind: Entry["kind"], order: number): Entry {
  const institution = findLabeledBullet(block.body, "Institution");
  const field = findLabeledBullet(block.body, "Field");
  const startRaw = findLabeledBullet(block.body, "Start") ?? findLabeledBullet(block.body, "Start date");
  const endRaw = findLabeledBullet(block.body, "End") ?? findLabeledBullet(block.body, "End date");
  const notes = findLabeledBullet(block.body, "Notes");
  return {
    kind,
    name: block.title,
    institution,
    field,
    startDate: startRaw ? parseDate(startRaw) : null,
    endDate: endRaw ? parseDate(endRaw) : null,
    notes,
    order,
  };
}

function detectKind(heading: string): Entry["kind"] | null {
  const h = heading.toLowerCase();
  if (h.includes("degree")) return "degree";
  if (h.includes("certif")) return "certification";
  if (h.includes("course") || h.includes("training")) return "course";
  return null;
}

export function parseEducation(source: string): Entry[] {
  const { sections } = splitSections(source);
  const out: Entry[] = [];
  for (const [heading, body] of Object.entries(sections)) {
    const kind = detectKind(heading);
    if (!kind) continue;
    const h3Blocks = splitH3Blocks(body);
    if (h3Blocks.length > 0) {
      h3Blocks.forEach((block, i) => {
        const entry = parseH3Block(block, kind, i);
        if (entry.name) out.push(entry);
      });
      continue;
    }
    const lines = body.split("\n").filter((l) => l.trim().startsWith("-"));
    lines.forEach((line, i) => {
      const e = parseCsvBullet(line, kind, i);
      if (e && e.name) out.push(e);
    });
  }
  return out;
}
