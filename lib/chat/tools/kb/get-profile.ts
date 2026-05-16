import { Type } from "typebox";
import { db } from "@/server/data/db.js";
import type { KbTool } from "../types.js";

const parameters = Type.Object({});

export function makeGetProfileTool(userId: number): KbTool<typeof parameters> {
  return {
    name: "get_profile",
    description:
      "Returns the user's profile data from their knowledge base (name, headline, location, contact, summary, key qualifications, languages). Use when the user asks about their profile or personal information.",
    parameters,
    async execute(_args) {
      const profile = await db.profile.findUnique({
        where: { userId },
        include: {
          keyQualifications: { orderBy: { order: "asc" } },
          languages: { orderBy: { order: "asc" } },
        },
      });

      if (!profile) return { profile: null };

      return {
        profile: {
          fullName: profile.fullName,
          headline: profile.headline,
          location:
            profile.locationCity || profile.locationCountry
              ? [profile.locationCity, profile.locationCountry].filter(Boolean).join(", ")
              : null,
          email: profile.email,
          phone: profile.phone,
          linkedinUrl: profile.linkedinUrl,
          githubUrl: profile.githubUrl,
          websiteUrl: profile.websiteUrl,
          professionalSummary: profile.professionalSummary,
          keyQualifications: profile.keyQualifications.map((q) => q.text),
          languages: profile.languages.map((l) => ({ name: l.name, proficiency: l.proficiency })),
        },
      };
    },
  };
}
