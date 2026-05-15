import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { TagsSection } from "./tags-section";
import { AuthSection } from "./auth-section";
import { ImporterSection } from "./importer-section";
import { DangerZoneSection } from "./danger-zone-section";

export default async function SettingsPage() {
  // scopeToUser: Tag is a global model
  const tags = await db.tag.findMany({
    orderBy: { slug: "asc" },
    include: { _count: { select: { roles: true, achievements: true, softSkills: true } } },
  });
  const lastRun = await db.importRun.findFirst({ // scopeToUser: scoped via userId
    where: { userId: CURRENT_USER_ID },
    orderBy: { startedAt: "desc" },
  });
  const authEnabled = !!process.env.ADMIN_PASSWORD_HASH;

  return (
    <>
      <Header title="Settings" />
      <div className="p-2xl max-w-[720px] flex flex-col gap-3xl">
        <TagsSection
          tags={tags.map((t) => ({
            id: t.id,
            slug: t.slug,
            label: t.label,
            usage: t._count.roles + t._count.achievements + t._count.softSkills,
          }))}
        />
        <AuthSection enabled={authEnabled} />
        <ImporterSection
          lastRun={
            lastRun
              ? {
                  finishedAt: lastRun.finishedAt,
                  result: lastRun.result,
                  summary: lastRun.summary as { counts?: { imported: number; updated: number }; skipped?: { file: string; error: string }[] },
                }
              : null
          }
        />
        <DangerZoneSection />
      </div>
    </>
  );
}
