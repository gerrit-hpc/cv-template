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
  return body.split("\n").filter((l) => l.trim().startsWith("-")).map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean);
}

function splitH3Sections(body: string): { sections: Record<string, string> } {
  const lines = body.split("\n");
  const sections: Record<string, string> = {};
  let current: string | null = null;
  let buffer: string[] = [];
  const flush = () => { if (current !== null) sections[current] = buffer.join("\n").replace(/^\n+/, ""); };
  for (const line of lines) {
    const m = line.match(/^###\s+(.+?)\s*$/);
    if (m) { flush(); current = m[1]!; buffer = []; }
    else if (current !== null) buffer.push(line);
  }
  flush();
  return { sections };
}

function splitH3Blocks(body: string): { title: string; body: string }[] {
  const { sections } = splitH3Sections(body);
  return Object.entries(sections).map(([title, body]) => ({ title, body }));
}

export function parseTailoringStrategy(source: string) {
  const { content } = parseFrontmatter(source);
  const { sections } = splitSections(content);
  const jdSummaryBody = sections["JD Summary"] ?? "";
  const { sections: jdSubs } = splitH3Sections(jdSummaryBody);
  const strategyBody = sections["Strategy"] ?? "";
  const { sections: strategySubs } = splitH3Sections(strategyBody);
  const coverBody = strategySubs["Cover letter"] ?? "";
  const gapsBody = sections["Gaps flagged"] ?? "";
  const gapBlocks = splitH3Blocks(gapsBody);

  const findLabel = (body: string, label: string) => {
    const re = new RegExp(`^\\*\\*${label}\\*\\*:\\s*(.+)`, "m");
    const m = body.match(re);
    return m ? m[1]!.trim() : "";
  };

  return {
    jdSummary: {
      mustHaves: bulletItems(jdSubs["Must-haves"] ?? ""),
      niceToHaves: bulletItems(jdSubs["Nice-to-haves"] ?? ""),
      signals: bulletItems(jdSubs["Signals"] ?? ""),
      ambiguities: bulletItems(jdSubs["Ambiguities"] ?? ""),
    },
    strategy: {
      headlineSummary: (strategySubs["Headline summary"] ?? "").trim(),
      experienceOrder: [],
      skillsLead: [],
      skillsDeprioritize: [],
      coverLetterAngle: {
        hook: findLabel(coverBody, "Hook"),
        body1: findLabel(coverBody, "Body 1"),
        body2: findLabel(coverBody, "Body 2"),
        close: findLabel(coverBody, "Close"),
      },
    },
    gaps: gapBlocks.map((b) => ({
      requirement: b.title,
      optionA: findLabel(b.body, "Option A"),
      optionB: findLabel(b.body, "Option B"),
      recommendation: (findLabel(b.body, "Recommendation") || "A") as "A" | "B" | "address-head-on",
    })),
  };
}

export function parseCompanyNotes(source: string) {
  const { content } = parseFrontmatter(source);
  const { sections } = splitSections(content);
  return {
    company: {
      overview: (sections["Overview"] ?? "").trim(),
      products: (sections["Products"] ?? "").trim(),
      recentSignals: (sections["Recent signals"] ?? "").trim(),
      leadership: (sections["Leadership"] ?? "").trim(),
      reputation: (sections["Reputation"] ?? "").trim(),
    },
    role: {
      beyondJd: (sections["Beyond the JD"] ?? "").trim(),
      whyRole: (sections["Why this role"] ?? "").trim(),
    },
    process: {
      stages: [],
      peopleToMeet: [],
      logistics: (sections["Logistics"] ?? "").trim(),
    },
    calibration: {
      style: "mixed" as const,
      difficulty: "mid-rigorous" as const,
      tone: "casual" as const,
      justification: (sections["Justification"] ?? "").trim(),
    },
    riskAreas: (sections["Risk areas"] ?? "").trim(),
  };
}
