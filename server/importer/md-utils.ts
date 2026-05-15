import matter from "gray-matter";

export function parseFrontmatter(source: string): { data: Record<string, unknown>; content: string } {
  const parsed = matter(source);
  return { data: parsed.data as Record<string, unknown>, content: parsed.content };
}

export function splitSections(body: string): { preamble: string; sections: Record<string, string> } {
  const lines = body.split("\n");
  const preambleLines: string[] = [];
  const sections: Record<string, string> = {};
  let current: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (current !== null) {
      sections[current] = buffer.join("\n").replace(/^\n+/, "");
    }
  };

  for (const line of lines) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      flush();
      current = m[1]!;
      buffer = [];
    } else if (current === null) {
      preambleLines.push(line);
    } else {
      buffer.push(line);
    }
  }
  flush();
  return { preamble: preambleLines.join("\n").trim() + (preambleLines.length ? "\n" : ""), sections };
}
