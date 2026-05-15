import { notFound } from "next/navigation";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { BackLink } from "@/components/navigation/back-link";
import { ExperienceForm } from "../experience-form";
import { AchievementsSection } from "./achievements-section";
import { HighlightsSection } from "./highlights-section";
import { LinkedSkillsSection } from "./linked-skills-section";

export const dynamic = "force-dynamic";

export default async function ExperienceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const role = await db.experienceRole.findFirst({ // scopeToUser
    where: { userId: CURRENT_USER_ID, slug },
    include: {
      tags: { include: { tag: true } },
      achievements: { include: { tags: { include: { tag: true } } }, orderBy: { order: "asc" } },
      highlights: { orderBy: { order: "asc" } },
      skillApplications: { include: { skill: { include: { category: true } } } },
    },
  });
  if (!role) notFound();
  const tags = await db.tag.findMany({ orderBy: { slug: "asc" } });

  return (
    <>
      <Header title={role.title} subtitle={role.company} />
      <div className="p-2xl flex flex-col gap-3xl">
        <BackLink href="/experience" label="Experience" />
        <ExperienceForm mode="edit" role={role} availableTags={tags} />
        {role.isHighlightsOnly ? (
          <HighlightsSection roleId={role.id} items={role.highlights} />
        ) : (
          <AchievementsSection roleId={role.id} items={role.achievements} availableTags={tags} />
        )}
        <LinkedSkillsSection
          skills={role.skillApplications.map((sa) => ({
            id: sa.skill.id,
            name: sa.skill.name,
            categoryName: sa.skill.category.name,
            proficiency: sa.skill.proficiency,
          }))}
        />
      </div>
    </>
  );
}
