import { Type } from "typebox";
import { db } from "@/server/data/db.js";
import type { KbTool } from "../types.js";

const parameters = Type.Object({});

export function makeListExperienceTool(userId: number): KbTool<typeof parameters> {
  return {
    name: "list_experience",
    description:
      "Returns a short index of the user's work history (one line per role: slug, company, title, dates, location, employment type). Call this first when the user asks about experience or career history; then call get_experience_detail for the specific role you need.",
    parameters,
    async execute(_args) {
      const roles = await db.experienceRole.findMany({ // scopeToUser: userId closure
        where: { userId },
        select: {
          slug: true,
          company: true,
          title: true,
          startDate: true,
          endDate: true,
          location: true,
          employmentType: true,
        },
        orderBy: { startDate: "desc" },
      });

      return {
        roles: roles.map((r) => ({
          slug: r.slug,
          company: r.company,
          title: r.title,
          startDate: r.startDate,
          endDate: r.endDate,
          location: r.location,
          employmentType: r.employmentType,
        })),
      };
    },
  };
}
