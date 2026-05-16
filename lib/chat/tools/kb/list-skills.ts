import { Type } from "typebox";
import { db } from "@/server/data/db.js";
import type { KbTool } from "../types.js";

const parameters = Type.Object({});

export function makeListSkillsTool(userId: number): KbTool<typeof parameters> {
  return {
    name: "list_skills",
    description:
      "Returns the user's skills data from their knowledge base (skill categories with individual skills and proficiency levels, plus soft skills with demonstration context). Use when the user asks about their skills, competencies, or expertise.",
    parameters,
    async execute(_args) {
      const [categories, softSkills] = await Promise.all([
        db.skillCategory.findMany({ // scopeToUser: userId closure
          where: { userId },
          orderBy: { order: "asc" },
          include: {
            skills: { orderBy: { order: "asc" } },
          },
        }),
        db.softSkill.findMany({ // scopeToUser: userId closure
          where: { userId },
          orderBy: { order: "asc" },
          include: { tags: { include: { tag: true } } },
        }),
      ]);

      return {
        categories: categories.map((cat) => ({
          name: cat.name,
          skills: cat.skills.map((s) => ({
            name: s.name,
            proficiency: s.proficiency,
            notes: s.notes,
          })),
        })),
        softSkills: softSkills.map((ss) => ({
          name: ss.name,
          whereDemonstrated: ss.whereDemonstrated,
          whatHappened: ss.whatHappened,
          tags: ss.tags.map((t) => t.tag.slug),
        })),
      };
    },
  };
}
