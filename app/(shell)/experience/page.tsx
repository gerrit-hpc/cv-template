import Link from "next/link";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function ExperienceListPage() {
  const roles = await db.experienceRole.findMany({ // scopeToUser
    where: { userId: CURRENT_USER_ID },
    include: { tags: { include: { tag: true } } },
    orderBy: { startDate: "desc" },
  });

  return (
    <>
      <Header
        title="Experience"
        subtitle={`${roles.length} role${roles.length === 1 ? "" : "s"}`}
        actions={
          <Link href={"/experience/new" as never}>
            <Button>Add role</Button>
          </Link>
        }
      />
      <div className="p-2xl flex flex-col gap-md">
        {roles.length === 0 ? (
          <EmptyState
            title="No roles yet"
            description="You haven't added any roles. Import your existing markdown KB or add your first role manually."
            actions={
              <>
                <Link href={"/settings" as never}><Button>Import from markdown</Button></Link>
                <Link href={"/experience/new" as never}><Button variant="secondary">Add role</Button></Link>
              </>
            }
          />
        ) : (
          roles.map((role) => (
            <Link key={role.id} href={`/experience/${role.slug}` as never}>
              <Card className="hover:bg-surface-raised">
                <CardBody className="flex flex-col gap-sm">
                  <p className="text-subheading">{role.title}</p>
                  <p className="text-small text-text-secondary">
                    {role.company} · {role.employmentType.replace("_", "-")} · {role.location ?? "—"} · {role.startDate} — {role.endDate ?? "present"}
                  </p>
                  <p className="text-body text-text-secondary line-clamp-2">{role.overview}</p>
                  <div className="flex flex-wrap gap-xs">
                    {role.tags.map((t) => <Tag key={t.tagId}>{t.tag.label}</Tag>)}
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
