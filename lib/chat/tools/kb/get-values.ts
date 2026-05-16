import { Type } from "typebox";
import { db } from "@/server/data/db.js";
import type { KbTool } from "../types.js";

const parameters = Type.Object({});

export function makeGetValuesTool(userId: number): KbTool<typeof parameters> {
  return {
    name: "get_values",
    description:
      "Returns the user's values data from their knowledge base (career principles, career narrative, industry opinions, LinkedIn themes). Use when the user asks about their values, career philosophy, opinions, or what drives them professionally.",
    parameters,
    async execute(_args) {
      const [principles, narrative, opinions, themes] = await Promise.all([
        db.valuePrinciple.findMany({
          where: { userId },
          orderBy: { order: "asc" },
          select: { statement: true, justification: true },
        }),
        db.valueCareerNarrative.findUnique({
          where: { userId },
          select: { text: true },
        }),
        db.valueIndustryOpinion.findMany({
          where: { userId },
          orderBy: { order: "asc" },
          select: { position: true, why: true, counterargument: true },
        }),
        db.valueLinkedInTheme.findMany({
          where: { userId },
          orderBy: { order: "asc" },
          select: { text: true },
        }),
      ]);

      return {
        principles: principles.map((p) => ({
          statement: p.statement,
          justification: p.justification,
        })),
        careerNarrative: narrative?.text ?? null,
        industryOpinions: opinions.map((o) => ({
          position: o.position,
          why: o.why,
          counterargument: o.counterargument,
        })),
        linkedInThemes: themes.map((t) => t.text),
      };
    },
  };
}
