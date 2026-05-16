import { parseFrontmatter, splitSections } from "@/server/importer/md-utils";

type JdSourceType = "url" | "path" | "pasted";

export function parseJobDescription(source: string): {
  sourceType: JdSourceType;
  sourceValue: string | null;
  capturedAt: string | null;
  content: string;
} {
  const { data, content } = parseFrontmatter(source);
  const src = String(data.source ?? "pasted");
  const sourceType: JdSourceType = src.startsWith("http") ? "url" : src === "pasted" ? "pasted" : "path";
  return {
    sourceType,
    sourceValue: src === "pasted" ? null : src,
    capturedAt: data.captured_at
      ? data.captured_at instanceof Date
        ? data.captured_at.toISOString().slice(0, 10)
        : String(data.captured_at)
      : null,
    content: content.trim(),
  };
}

function bulletItems(body: string): string[] {
  return body
    .split("\n")
    .filter((l) => l.trim().startsWith("-"))
    .map((l) => l.replace(/^\s*-\s*/, "").trim())
    .filter(Boolean);
}

function splitHeadingSections(body: string, level: 1 | 2 | 3): Record<string, string> {
  const prefix = "#".repeat(level);
  const re = new RegExp(`^${prefix}\\s+(.+?)\\s*$`);
  const lines = body.split("\n");
  const sections: Record<string, string> = {};
  let current: string | null = null;
  let buffer: string[] = [];
  const flush = () => {
    if (current !== null) sections[current] = buffer.join("\n").replace(/^\n+/, "");
  };
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      flush();
      current = m[1]!;
      buffer = [];
    } else if (current !== null) {
      buffer.push(line);
    }
  }
  flush();
  return sections;
}

function findSection(sections: Record<string, string>, ...candidates: string[]): string {
  const normalized = new Map<string, string>();
  for (const [k, v] of Object.entries(sections)) {
    normalized.set(k.toLowerCase().trim(), v);
  }
  for (const c of candidates) {
    const found = normalized.get(c.toLowerCase());
    if (found !== undefined) return found;
    for (const [k, v] of normalized.entries()) {
      if (k.includes(c.toLowerCase())) return v;
    }
  }
  return "";
}

function bulletsUnderBoldLabel(body: string, label: string): string[] {
  const re = new RegExp(`^\\s*\\*\\*${label}[^*]*\\*\\*\\s*[:.]?\\s*$`, "im");
  const lines = body.split("\n");
  const collected: string[] = [];
  let inBlock = false;
  for (const line of lines) {
    if (re.test(line)) {
      inBlock = true;
      continue;
    }
    if (inBlock) {
      if (/^\s*\*\*[^*]+\*\*\s*[:.]?\s*$/.test(line)) break;
      if (/^#{1,6}\s+/.test(line)) break;
      if (line.trim().startsWith("-")) {
        collected.push(line.replace(/^\s*-\s*/, "").trim());
      } else if (line.trim() === "" && collected.length === 0) {
        continue;
      } else if (line.trim() === "" && collected.length > 0) {
        // allow blank lines within block; do not break
        continue;
      } else if (collected.length > 0 && !line.trim().startsWith("-")) {
        break;
      }
    }
  }
  return collected.filter(Boolean);
}

function findCoverLetterLabel(body: string, label: string): string {
  const reBulletBold = new RegExp(`^\\s*-\\s*\\*\\*${label}\\*\\*\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*-\\s*\\*\\*|\\n\\s*#{1,6}\\s+|$)`, "im");
  const m1 = body.match(reBulletBold);
  if (m1) return m1[1]!.trim();
  const rePlain = new RegExp(`^\\*\\*${label}\\*\\*\\s*:\\s*(.+)$`, "im");
  const m2 = body.match(rePlain);
  return m2 ? m2[1]!.trim() : "";
}

function parseGapsBulletStyle(body: string): { requirement: string; optionA: string; optionB: string; recommendation: "A" | "B" | "address-head-on" }[] {
  const lines = body.split("\n");
  const gaps: { requirement: string; optionA: string; optionB: string; recommendation: "A" | "B" | "address-head-on" }[] = [];
  let current: { requirement: string; optionA: string; optionB: string; recommendation: "A" | "B" | "address-head-on" } | null = null;
  for (const line of lines) {
    const reqMatch = line.match(/^\s*-\s+\*\*([^*]+?)\*\*\s*:?\s*(.*)$/);
    if (reqMatch && !/^Option /i.test(reqMatch[1]!) && !/^Default/i.test(reqMatch[1]!)) {
      if (current) gaps.push(current);
      current = { requirement: reqMatch[1]!.trim(), optionA: "", optionB: "", recommendation: "A" };
      continue;
    }
    if (!current) continue;
    const optAMatch = line.match(/(?:→\s*|^\s*-\s*)Option\s*A\s*:\s*(.+)$/i);
    if (optAMatch) {
      current.optionA = optAMatch[1]!.trim();
      continue;
    }
    const optBMatch = line.match(/(?:→\s*|^\s*-\s*)Option\s*B\s*:\s*(.+)$/i);
    if (optBMatch) {
      current.optionB = optBMatch[1]!.trim();
      continue;
    }
    const defaultMatch = line.match(/\*\*Default\s*:\s*([AB]|address-head-on)\*\*/i);
    if (defaultMatch) {
      current.recommendation = defaultMatch[1]!.toUpperCase() === "B" ? "B" : defaultMatch[1]!.toLowerCase() === "address-head-on" ? "address-head-on" : "A";
      continue;
    }
    const recMatch = line.match(/(?:→\s*|^\s*-\s*)Recommendation\s*:\s*([AB]|address-head-on)/i);
    if (recMatch) {
      current.recommendation = recMatch[1]!.toUpperCase() === "B" ? "B" : recMatch[1]!.toLowerCase() === "address-head-on" ? "address-head-on" : "A";
    }
  }
  if (current) gaps.push(current);
  return gaps.filter((g) => g.requirement);
}

function parseGapsH3Style(body: string): { requirement: string; optionA: string; optionB: string; recommendation: "A" | "B" | "address-head-on" }[] {
  const h3 = splitHeadingSections(body, 3);
  return Object.entries(h3).map(([title, b]) => {
    const optA = b.match(/^\*\*Option\s*A\*\*\s*:\s*(.+)$/im)?.[1]?.trim() ?? "";
    const optB = b.match(/^\*\*Option\s*B\*\*\s*:\s*(.+)$/im)?.[1]?.trim() ?? "";
    const rec = (b.match(/^\*\*Recommendation\*\*\s*:\s*(.+)$/im)?.[1]?.trim() ?? "A") as "A" | "B" | "address-head-on";
    return { requirement: title, optionA: optA, optionB: optB, recommendation: rec };
  });
}

export function parseTailoringStrategy(source: string) {
  const { content } = parseFrontmatter(source);
  const h1 = splitHeadingSections(content, 1);
  const h2 = splitSections(content).sections;

  const jdSummaryBody =
    findSection(h1, "JD Summary", "JD summary") ||
    findSection(h2, "JD Summary", "JD summary");

  const tailoringBody =
    findSection(h1, "Tailoring Strategy", "Tailoring strategy", "Strategy") ||
    findSection(h2, "Strategy", "Tailoring Strategy");

  const gapsBody =
    findSection(h1, "Gaps flagged", "Gaps") ||
    findSection(h2, "Gaps flagged", "Gaps");

  let mustHaves = bulletsUnderBoldLabel(jdSummaryBody, "Must-haves");
  let niceToHaves = bulletsUnderBoldLabel(jdSummaryBody, "Nice-to-haves");
  let signals = bulletsUnderBoldLabel(jdSummaryBody, "Signals");
  let ambiguities = bulletsUnderBoldLabel(jdSummaryBody, "Ambiguities");

  if (mustHaves.length === 0 && niceToHaves.length === 0) {
    const jdH3 = splitHeadingSections(jdSummaryBody, 3);
    mustHaves = bulletItems(findSection(jdH3, "Must-haves"));
    niceToHaves = bulletItems(findSection(jdH3, "Nice-to-haves"));
    signals = bulletItems(findSection(jdH3, "Signals"));
    ambiguities = bulletItems(findSection(jdH3, "Ambiguities"));
  }

  const tailoringH2 = splitHeadingSections(tailoringBody, 2);
  const tailoringH3 = splitHeadingSections(tailoringBody, 3);
  const headlineBody =
    findSection(tailoringH2, "Headline & summary", "Headline summary", "Headline and summary", "Headline") ||
    findSection(tailoringH3, "Headline summary", "Headline & summary", "Headline");
  const headlineSummary = headlineBody.trim();

  const coverBody =
    findSection(tailoringH2, "Cover letter angle", "Cover letter") ||
    findSection(tailoringH3, "Cover letter angle", "Cover letter");

  const skillsBody =
    findSection(tailoringH2, "Skills to lead with", "Skills") ||
    findSection(tailoringH3, "Skills to lead with", "Skills");

  const skillsLead = bulletItems(skillsBody);
  const deprioritizeMatch = skillsBody.match(/\*\*Deprioriti[sz]e[^*]*\*\*\s*:\s*(.+)$/im);
  const skillsDeprioritize = deprioritizeMatch
    ? deprioritizeMatch[1]!.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
    : [];

  let gaps = parseGapsBulletStyle(gapsBody);
  if (gaps.length === 0) gaps = parseGapsH3Style(gapsBody);

  return {
    jdSummary: { mustHaves, niceToHaves, signals, ambiguities },
    strategy: {
      headlineSummary,
      experienceOrder: [],
      skillsLead,
      skillsDeprioritize,
      coverLetterAngle: {
        hook: findCoverLetterLabel(coverBody, "Hook"),
        body1: findCoverLetterLabel(coverBody, "Body 1"),
        body2: findCoverLetterLabel(coverBody, "Body 2"),
        close: findCoverLetterLabel(coverBody, "Close"),
      },
    },
    gaps,
  };
}

export function parseCompanyNotes(source: string) {
  const { content } = parseFrontmatter(source);
  const h1 = splitHeadingSections(content, 1);
  const h2 = splitSections(content).sections;

  const companyBody = findSection(h1, "Company") || "";
  const roleBody = findSection(h1, "Role") || "";
  const processBody = findSection(h1, "Process") || "";
  const calibrationBody = findSection(h1, "Calibration") || "";

  const companyH2 = splitHeadingSections(companyBody, 2);
  const roleH2 = splitHeadingSections(roleBody, 2);
  const processH2 = splitHeadingSections(processBody, 2);
  const calibrationH2 = splitHeadingSections(calibrationBody, 2);

  const overview = (findSection(companyH2, "Overview") || findSection(h2, "Overview")).trim();
  const products = (findSection(companyH2, "Products") || findSection(h2, "Products")).trim();
  const recentSignals = (findSection(companyH2, "Recent signals") || findSection(h2, "Recent signals")).trim();
  const leadership = (findSection(companyH2, "Leadership") || findSection(h2, "Leadership")).trim();
  const reputation = (findSection(companyH2, "Reputation") || findSection(h2, "Reputation")).trim();

  const beyondJd = (findSection(roleH2, "Beyond the JD", "Beyond JD") || findSection(h2, "Beyond the JD", "Beyond JD")).trim();
  const whyRole = (findSection(roleH2, "Why this role") || findSection(h2, "Why this role")).trim();

  const logistics = (findSection(processH2, "Logistics") || findSection(h2, "Logistics")).trim();

  const calibration = (() => {
    const yamlMatch = calibrationBody.match(/```ya?ml\s*([\s\S]+?)```/);
    let style: "structured-behavioral" | "unstructured-conversational" | "case-heavy" | "coding-heavy" | "culture-heavy" | "mixed" = "mixed";
    let difficulty: "junior-screen" | "mid-rigorous" | "staff-level-deep-dive" | "leadership-fit" | "hybrid" = "mid-rigorous";
    let tone: "formal" | "casual" | "startup-scrappy" | "corporate" = "casual";
    if (yamlMatch) {
      const yaml = yamlMatch[1]!;
      const s = yaml.match(/^\s*style\s*:\s*(\S+)/m)?.[1];
      const d = yaml.match(/^\s*difficulty\s*:\s*(\S+)/m)?.[1];
      const t = yaml.match(/^\s*tone\s*:\s*(\S+)/m)?.[1];
      if (s) style = s as typeof style;
      if (d) difficulty = d as typeof difficulty;
      if (t) tone = t as typeof tone;
    }
    const justification = (findSection(calibrationH2, "Justification") || findSection(h2, "Justification")).trim();
    return { style, difficulty, tone, justification };
  })();

  const riskAreas = (
    findSection(calibrationH2, "Risk areas") ||
    findSection(h2, "Risk areas")
  ).trim();

  return {
    company: { overview, products, recentSignals, leadership, reputation },
    role: { beyondJd, whyRole },
    process: { stages: [], peopleToMeet: [], logistics },
    calibration,
    riskAreas,
  };
}
