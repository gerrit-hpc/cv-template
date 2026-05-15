import { db } from "@/server/data/db";
import { Header } from "@/components/navigation/header";
import { BackLink } from "@/components/navigation/back-link";
import { ExperienceForm } from "../experience-form";

export const dynamic = "force-dynamic";

export default async function NewExperiencePage() {
  const tags = await db.tag.findMany({ orderBy: { slug: "asc" } });
  return (
    <>
      <Header title="Add role" />
      <div className="p-2xl max-w-[720px] flex flex-col gap-md">
        <BackLink href="/experience" label="Experience" />
        <ExperienceForm mode="create" role={null} availableTags={tags} />
      </div>
    </>
  );
}
