import { splitSections } from "@/server/importer/md-utils";

type Skill = { name: string; proficiency: "familiar" | "proficient" | "expert"; notes: string | null; appliedAt: string[]; order: number };
type Category = { name: string; order: number; skills: Skill[] };

function normalizeProficiency(s: string): Skill["proficiency"] {
  const lower = s.toLowerCase();
  if (lower.includes("expert")) return "expert";
  if (lower.includes("proficient")) return "proficient";
  return "familiar";
}

function parseTableRows(body: string): { headers: string[]; rows: string[][] } {
  const lines = body.split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0]!.split("|").map((s) => s.trim()).filter(Boolean);
  // Each data row: split on |, drop the empty first/last cells from leading/trailing |
  const rows = lines.slice(2).map((l) => {
    const cells = l.split("|").map((s) => s.trim());
    // remove first/last if empty
    if (cells.length && cells[0] === "") cells.shift();
    if (cells.length && cells[cells.length - 1] === "") cells.pop();
    return cells;
  });
  return { headers, rows };
}

export function parseSkills(source: string): { categories: Category[]; softSkills: { name: string; whereDemonstrated: string; whatHappened: string; tagSlugs: string[]; order: number }[] } {
  const { sections } = splitSections(source);
  const categories: Category[] = [];
  let order = 0;
  for (const [heading, body] of Object.entries(sections)) {
    if (heading.toLowerCase().includes("soft skill")) continue;
    const { headers, rows } = parseTableRows(body);
    if (headers.length === 0) continue;
    const skills: Skill[] = rows.map((cells, i) => ({
      name: cells[0] ?? "",
      proficiency: normalizeProficiency(cells[1] ?? ""),
      appliedAt: (cells[2] ?? "—") === "—" ? [] : cells[2]!.split(",").map((s) => s.trim()).filter(Boolean),
      notes: cells[3] && cells[3] !== "—" ? cells[3] : null,
      order: i,
    })).filter((s) => s.name);
    categories.push({ name: heading, order: order++, skills });
  }
  return { categories, softSkills: [] };
}
