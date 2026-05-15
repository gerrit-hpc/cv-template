import Link from "next/link";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, type ApplicationStatus } from "@/components/ui/status-badge";
import { RelativeDate } from "@/components/ui/relative-date";

export default async function ApplicationsListPage() {
  const apps = await db.application.findMany({ // scopeToUser
    where: { userId: CURRENT_USER_ID },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <Header
        title="Applications"
        subtitle={`${apps.length} application${apps.length === 1 ? "" : "s"}`}
        actions={<Link href={"/applications/new" as never}><Button>New application</Button></Link>}
      />
      <div className="p-2xl">
        {apps.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="Create an application to start tailoring CVs and tracking interviews."
            actions={<Link href={"/applications/new" as never}><Button>New application</Button></Link>}
          />
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_140px_180px_100px] gap-md px-lg py-sm bg-surface text-label uppercase text-text-secondary border-b border-border">
              <span>Company</span><span>Role</span><span>Status</span><span>Updated</span><span></span>
            </div>
            {apps.map((a) => (
              <Link
                key={a.id}
                href={`/applications/${a.slug}` as never}
                className="grid grid-cols-[1fr_1fr_140px_180px_100px] gap-md items-center px-lg h-12 hover:bg-surface-raised border-b border-border-subtle last:border-b-0"
              >
                <span className="text-body">{a.company}</span>
                <span className="text-body">{a.roleTitle}</span>
                <StatusBadge status={a.status as ApplicationStatus} />
                <RelativeDate date={a.updatedAt} />
                <Button variant="ghost">Open</Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
