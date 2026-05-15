import { splitSections } from "@/server/importer/md-utils";

type Principle = { statement: string; justification: string; order: number };
type Opinion = { position: string; why: string; counterargument: string; order: number };
type Theme = { text: string; order: number };

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

function findLabelLine(body: string, label: string): string {
  const re = new RegExp(`^${label}:\\s*(.+)$`, "m");
  const m = body.match(re);
  return m ? m[1]!.trim() : "";
}

export function parseValues(source: string): {
  principles: Principle[];
  narrative: string;
  opinions: Opinion[];
  themes: Theme[];
} {
  const { sections } = splitSections(source);
  const principlesBody = sections["Principles"] ?? "";
  const principles = splitH3Blocks(principlesBody).map((b, i) => ({
    statement: b.title,
    justification: b.body.trim(),
    order: i,
  }));
  const narrative = (sections["Career narrative"] ?? "").trim();
  const opinionsBody = sections["Industry opinions"] ?? "";
  const opinions = splitH3Blocks(opinionsBody).map((b, i) => ({
    position: findLabelLine(b.body, "Position") || b.title,
    why: findLabelLine(b.body, "Why"),
    counterargument: findLabelLine(b.body, "Counterargument"),
    order: i,
  }));
  const themesBody = sections["LinkedIn themes"] ?? "";
  const themes = themesBody
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l, i) => ({ text: l.replace(/^\s*-\s*/, "").trim(), order: i }))
    .filter((t) => t.text);

  return { principles, narrative, opinions, themes };
}
