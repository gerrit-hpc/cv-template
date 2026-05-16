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

function findSection(sections: Record<string, string>, ...candidates: string[]): string {
  const normalized = new Map<string, string>();
  for (const [k, v] of Object.entries(sections)) {
    normalized.set(k.toLowerCase().trim(), v);
  }
  for (const c of candidates) {
    const found = normalized.get(c.toLowerCase());
    if (found !== undefined) return found;
  }
  return "";
}

function findLabel(body: string, label: string): string {
  const boldRe = new RegExp(`\\*\\*${label}[^*]*\\*\\*\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*\\n|\\n\\s*\\*\\*|\\n\\s*###|$)`, "i");
  const m1 = body.match(boldRe);
  if (m1) return m1[1]!.trim();
  const plainRe = new RegExp(`^${label}[^:]*:\\s*(.+)$`, "im");
  const m2 = body.match(plainRe);
  return m2 ? m2[1]!.trim() : "";
}

function parseNumberedBoldItems(body: string): { title: string; body: string }[] {
  const items: { title: string; body: string }[] = [];
  const lines = body.split("\n");
  let current: { title: string; body: string } | null = null;
  for (const line of lines) {
    const m = line.match(/^\s*\d+\.\s+\*\*([^*]+?)\*\*\s*:\s*(.*)$/);
    if (m) {
      if (current) items.push(current);
      current = { title: m[1]!.trim(), body: m[2]!.trim() };
    } else if (current) {
      if (line.trim() === "" && current.body) {
        items.push(current);
        current = null;
      } else if (line.trim()) {
        current.body += (current.body ? " " : "") + line.trim();
      }
    }
  }
  if (current) items.push(current);
  return items;
}

function parseThemes(body: string): Theme[] {
  const numbered = parseNumberedBoldItems(body);
  if (numbered.length > 0) {
    return numbered.map((n, i) => ({ text: `${n.title}: ${n.body}`.trim().replace(/:\s*$/, ""), order: i }));
  }
  const numberedPlain = body
    .split("\n")
    .map((l) => l.match(/^\s*\d+\.\s+(.+)$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m, i) => ({ text: m[1]!.trim(), order: i }));
  if (numberedPlain.length > 0) return numberedPlain;
  return body
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l, i) => ({ text: l.replace(/^\s*-\s*/, "").trim(), order: i }))
    .filter((t) => t.text);
}

function parsePrinciples(body: string): Principle[] {
  const numbered = parseNumberedBoldItems(body);
  if (numbered.length > 0) {
    return numbered.map((n, i) => ({ statement: n.title, justification: n.body, order: i }));
  }
  return splitH3Blocks(body).map((b, i) => ({
    statement: b.title,
    justification: b.body.trim(),
    order: i,
  }));
}

function parseOpinions(body: string): Opinion[] {
  return splitH3Blocks(body).map((b, i) => {
    const position = findLabel(b.body, "Position") || b.title;
    const why = findLabel(b.body, "Why");
    const counterargument =
      findLabel(b.body, "Counterargument") ||
      findLabel(b.body, "Counterargument I'd address") ||
      findLabel(b.body, "Counter-argument");
    return { position, why, counterargument, order: i };
  });
}

export function parseValues(source: string): {
  principles: Principle[];
  narrative: string;
  opinions: Opinion[];
  themes: Theme[];
} {
  const { sections } = splitSections(source);
  const principlesBody = findSection(sections, "Principles", "Core Principles", "Core principles");
  const narrativeBody = findSection(sections, "Career narrative", "Career Narrative");
  const opinionsBody = findSection(sections, "Industry opinions", "Industry Opinions");
  const themesBody = findSection(sections, "LinkedIn themes", "Themes for LinkedIn Content", "LinkedIn Themes");

  return {
    principles: parsePrinciples(principlesBody),
    narrative: narrativeBody.trim(),
    opinions: parseOpinions(opinionsBody),
    themes: parseThemes(themesBody),
  };
}
