import Link from "next/link";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { EducationItem } from "./education-item";

const KIND_LABEL = { degree: "Degrees", certification: "Certifications", course: "Courses" } as const;

export const dynamic = "force-dynamic";

export default async function EducationPage() {
  const entries = await db.educationEntry.findMany({ // scopeToUser
    where: { userId: CURRENT_USER_ID },
    orderBy: [{ kind: "asc" }, { order: "asc" }],
  });
  const grouped = entries.reduce<Record<string, typeof entries>>((acc, e) => {
    (acc[e.kind] ??= []).push(e);
    return acc;
  }, {});

  return (
    <>
      <Header title="Education" actions={<Link href={"/education/new" as never}><Button>Add education</Button></Link>} />
      <div className="p-2xl flex flex-col gap-3xl max-w-[720px]">
        {entries.length === 0 ? (
          <EmptyState
            title="No education entries yet"
            description="Add degrees, certifications, or courses."
            actions={<Link href={"/education/new" as never}><Button>Add education</Button></Link>}
          />
        ) : (
          (["degree", "certification", "course"] as const).map((k) =>
            grouped[k]?.length ? (
              <Card key={k}>
                <CardHeader title={KIND_LABEL[k]} />
                <CardBody className="flex flex-col gap-md">
                  {grouped[k]!.map((e) => <EducationItem key={e.id} entry={e} />)}
                </CardBody>
              </Card>
            ) : null,
          )
        )}
      </div>
    </>
  );
}
