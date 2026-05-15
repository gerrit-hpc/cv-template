import { parseFrontmatter, splitSections } from "@/server/importer/md-utils";

type Profile = {
  fullName: string;
  headline: string;
  locationCity: string | null;
  locationCountry: string | null;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  professionalSummary: string;
};

export type ParsedProfile = {
  profile: Profile;
  keyQualifications: { text: string; order: number }[];
  languages: { name: string; proficiency: string; order: number }[];
};

function parseBulletList(body: string): string[] {
  return body
    .split("\n")
    .map((l) => l.replace(/^\s*-\s+/, "").trim())
    .filter(Boolean);
}

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

export function parseProfile(source: string): ParsedProfile {
  const { data, content } = parseFrontmatter(source);
  const sections = splitH1Sections(content);
  const summary = (sections["Professional Summary"] ?? "").trim();
  const quals = parseBulletList(sections["Key Qualifications"] ?? "");
  const langs = parseBulletList(sections["Languages"] ?? "").map((line, i) => {
    const m = line.match(/^(.+?)\s*\((.+?)\)$/);
    return m ? { name: m[1]!.trim(), proficiency: m[2]!.trim(), order: i } : { name: line, proficiency: "", order: i };
  });

  return {
    profile: {
      fullName: String(data.fullName ?? ""),
      headline: String(data.headline ?? ""),
      locationCity: data.locationCity ? String(data.locationCity) : null,
      locationCountry: data.locationCountry ? String(data.locationCountry) : null,
      email: String(data.email ?? ""),
      phone: data.phone ? String(data.phone) : null,
      linkedinUrl: data.linkedinUrl ? String(data.linkedinUrl) : null,
      githubUrl: data.githubUrl ? String(data.githubUrl) : null,
      websiteUrl: data.websiteUrl ? String(data.websiteUrl) : null,
      professionalSummary: summary,
    },
    keyQualifications: quals.map((text, order) => ({ text, order })),
    languages: langs,
  };
}
