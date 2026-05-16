import { Type } from "typebox";
import { db } from "@/server/data/db.js";
import type { KbTool } from "../types.js";

const parameters = Type.Object({ slug: Type.String() });

export function makeGetExperienceDetailTool(userId: number): KbTool<typeof parameters> {
  return {
    name: "get_experience_detail",
    description:
      "Returns full detail for one work role (overview, scope, achievements, highlights, tags, skills used). Always use the slug value from list_experience. Returns null if the slug is not found.",
    parameters,
    async execute({ slug }) {
      const role = await db.experienceRole.findUnique({
        where: { userId_slug: { userId, slug } },
        include: {
          achievements: {
            orderBy: { order: "asc" },
            include: { tags: { include: { tag: true } } },
          },
          highlights: { orderBy: { order: "asc" } },
          tags: { include: { tag: true } },
          skillApplications: { include: { skill: true } },
        },
      });

      if (!role) return { role: null };

      return {
        role: {
          slug: role.slug,
          company: role.company,
          title: role.title,
          startDate: role.startDate,
          endDate: role.endDate,
          location: role.location,
          employmentType: role.employmentType,
          overview: role.overview,
          scopeTeamSize: role.scopeTeamSize,
          scopeReportingTo: role.scopeReportingTo,
          scopeTechStack: role.scopeTechStack,
          scopeBudget: role.scopeBudget,
          isHighlightsOnly: role.isHighlightsOnly,
          achievements: role.achievements.map((a) => ({
            title: a.title,
            result: a.result,
            context: a.context,
            action: a.action,
            tags: a.tags.map((t) => t.tag.slug),
          })),
          highlights: role.highlights.map((h) => ({ text: h.text })),
          tagSlugs: role.tags.map((t) => t.tag.slug),
          skillsUsed: role.skillApplications.map((sa) => ({
            name: sa.skill.name,
            proficiency: sa.skill.proficiency,
          })),
        },
      };
    },
  };
}
