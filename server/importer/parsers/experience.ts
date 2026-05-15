import { parseFrontmatter, splitSections } from "@/server/importer/md-utils";

type Role = {
  slug: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  employmentType: "full_time" | "part_time" | "contract" | "internship";
  companyUrl: string | null;
  overview: string;
  scopeTeamSize: string | null;
  scopeReportingTo: string | null;
  scopeTechStack: string | null;
  scopeBudget: string | null;
  isHighlightsOnly: boolean;
  tagSlugs: string[];
};

type Achievement = {
  title: string;
  result: string;
  context: string;
  action: string;
  order: number;
  tagSlugs: string[];
};

type Highlight = { text: string; order: number };

function normalizeEmploymentType(s: string): Role["employmentType"] {
  switch (s.toLowerCase().replace(/[\s-]/g, "_")) {
    case "full_time": return "full_time";
    case "part_time": return "part_time";
    case "contract": return "contract";
    case "internship": return "internship";
    default: return "full_time";
  }
}

// Splits on H1 headings (# Heading), returns map of heading -> body
function splitH1Sections(body: string): Record<string, string> {
  const lines = body.split("\n");
  const sections: Record<string, string> = {};
  let current: string | null = null;
  let buffer: string[] = [];
  const flush = () => { if (current !== null) sections[current] = buffer.join("\n").replace(/^\n+/, ""); };
  for (const line of lines) {
    const m = line.match(/^#\s+(.+?)\s*$/);
    if (m) { flush(); current = m[1]!; buffer = []; }
    else if (current !== null) buffer.push(line);
  }
  flush();
  return sections;
}

function parseScopeBullets(body: string): { teamSize: string | null; reportingTo: string | null; techStack: string | null; budget: string | null } {
  const out = { teamSize: null as string | null, reportingTo: null as string | null, techStack: null as string | null, budget: null as string | null };
  for (const line of body.split("\n")) {
    const m = line.match(/^\s*-\s*([^:]+):\s*(.+)$/);
    if (!m) continue;
    const key = m[1]!.trim().toLowerCase();
    const val = m[2]!.trim();
    if (key.startsWith("team size")) out.teamSize = val;
    else if (key.startsWith("reporting to")) out.reportingTo = val;
    else if (key.startsWith("tech stack")) out.techStack = val;
    else if (key.startsWith("budget")) out.budget = val;
  }
  return out;
}

function parseAchievementBlock(block: string, order: number): Achievement | null {
  const lines = block.split("\n");
  const titleLine = lines[0]?.replace(/^###\s+/, "").trim();
  if (!titleLine) return null;
  const find = (label: string) => {
    const re = new RegExp(`^\\*\\*${label}\\*\\*:\\s*(.+)`);
    const idx = lines.findIndex((l) => re.test(l));
    if (idx === -1) return "";
    return lines[idx]!.match(re)![1]!.trim();
  };
  const tagsLine = lines.find((l) => l.startsWith("**Tags**"));
  const tagSlugs = tagsLine ? Array.from(tagsLine.matchAll(/`([a-z0-9-]+)`/g)).map((m) => m[1]!) : [];
  return {
    title: titleLine,
    result: find("Result"),
    context: find("Context"),
    action: find("Action"),
    order,
    tagSlugs,
  };
}

export function parseExperience(source: string, slug: string): {
  role: Role;
  achievements: Achievement[];
  highlights: Highlight[];
} {
  const { data, content } = parseFrontmatter(source);
  const tagsFromFm = Array.isArray(data.tags) ? (data.tags as unknown[]).map(String) : [];

  // Split on H1 for Overview and Scope sections (which use # headings in fixtures)
  const h1Sections = splitH1Sections(content);
  // Split on H2 for Achievements and Highlights sections
  const { sections: h2Sections } = splitSections(content);

  const overview = (h1Sections["Overview"] ?? h2Sections["Overview"] ?? h2Sections["overview"] ?? "").trim();
  const scopeBody = h1Sections["Scope"] ?? h2Sections["Scope"] ?? h2Sections["scope"] ?? "";
  const scope = parseScopeBullets(scopeBody);
  const isHighlightsOnly = Object.keys(h2Sections).some((k) => k.toLowerCase() === "highlights");

  const achievementsBody = h2Sections["Achievements"] ?? "";
  const achievementBlocks = achievementsBody.split(/\n(?=###\s)/).filter((b) => b.trim().startsWith("###"));
  const achievements = achievementBlocks
    .map((b, i) => parseAchievementBlock(b, i))
    .filter((a): a is Achievement => a !== null);

  const highlightsBody = h2Sections["Highlights"] ?? "";
  const highlights = highlightsBody
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l, i) => ({ text: l.replace(/^\s*-\s*/, "").trim(), order: i }))
    .filter((h) => h.text);

  const role: Role = {
    slug,
    company: String(data.company ?? ""),
    title: String(data.title ?? ""),
    startDate: String(data.start_date ?? ""),
    endDate: data.end_date && data.end_date !== "present" ? String(data.end_date) : null,
    location: data.location ? String(data.location) : null,
    employmentType: normalizeEmploymentType(String(data.employment_type ?? "full-time")),
    companyUrl: data.company_url ? String(data.company_url) : null,
    overview,
    scopeTeamSize: scope.teamSize,
    scopeReportingTo: scope.reportingTo,
    scopeTechStack: scope.techStack,
    scopeBudget: scope.budget,
    isHighlightsOnly,
    tagSlugs: tagsFromFm,
  };

  return { role, achievements, highlights };
}
