import { Type } from "typebox";
import { db } from "@/server/data/db.js";
import type { KbTool } from "../types.js";

const parameters = Type.Object({});

export function makeGetEducationTool(userId: number): KbTool<typeof parameters> {
  return {
    name: "get_education",
    description:
      "Returns the user's education data from their knowledge base (degrees, certifications, courses). Use when the user asks about their education, qualifications, or formal training.",
    parameters,
    async execute(_args) {
      const entries = await db.educationEntry.findMany({
        where: { userId },
        orderBy: { order: "asc" },
        select: {
          kind: true,
          institution: true,
          name: true,
          field: true,
          startDate: true,
          endDate: true,
          notes: true,
        },
      });

      return {
        entries: entries.map((e) => ({
          kind: e.kind,
          institution: e.institution,
          name: e.name,
          field: e.field,
          startDate: e.startDate,
          endDate: e.endDate,
          notes: e.notes,
        })),
      };
    },
  };
}
