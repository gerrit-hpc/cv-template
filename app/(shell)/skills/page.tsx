import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { HardSkillsCategorySection } from "./hard-skills-category-section";
import { SoftSkillsSection } from "./soft-skills-section";
import { NewCategoryButton } from "./new-category-button";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const categories = await db.skillCategory.findMany({ // scopeToUser
    where: { userId: CURRENT_USER_ID },
    include: { skills: { orderBy: { order: "asc" }, include: { applications: { include: { role: true } } } } },
    orderBy: { order: "asc" },
  });
  const softSkills = await db.softSkill.findMany({ // scopeToUser
    where: { userId: CURRENT_USER_ID },
    include: { tags: { include: { tag: true } } },
    orderBy: { order: "asc" },
  });
  const tags = await db.tag.findMany({ orderBy: { slug: "asc" } });
  const roles = await db.experienceRole.findMany({ where: { userId: CURRENT_USER_ID }, select: { id: true, company: true, title: true } }); // scopeToUser

  return (
    <>
      <Header title="Skills" actions={<NewCategoryButton nextOrder={categories.length} />} />
      <div className="p-2xl flex flex-col gap-3xl">
        {categories.length === 0 ? (
          <EmptyState title="No skills yet" description="Import your KB or add categories and skills manually." actions={<Button>Add category</Button>} />
        ) : (
          categories.map((c) => (
            <HardSkillsCategorySection
              key={c.id}
              category={{ id: c.id, name: c.name, order: c.order }}
              skills={c.skills.map((s) => ({
                id: s.id,
                name: s.name,
                proficiency: s.proficiency,
                notes: s.notes,
                order: s.order,
                roleIds: s.applications.map((a) => a.role.id),
              }))}
              availableRoles={roles}
            />
          ))
        )}
        <SoftSkillsSection items={softSkills.map((s) => ({
          id: s.id,
          name: s.name,
          whereDemonstrated: s.whereDemonstrated,
          whatHappened: s.whatHappened,
          order: s.order,
          tags: s.tags.map((t) => t.tag.slug),
        }))} availableTags={tags} />
      </div>
    </>
  );
}
