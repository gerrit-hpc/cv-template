import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { PrinciplesSection } from "./principles-section";
import { NarrativeSection } from "./narrative-section";
import { OpinionsSection } from "./opinions-section";
import { ThemesSection } from "./themes-section";

export const dynamic = "force-dynamic";

export default async function ValuesPage() {
  const [principles, narrative, opinions, themes] = await Promise.all([
    db.valuePrinciple.findMany({ where: { userId: CURRENT_USER_ID }, orderBy: { order: "asc" } }), // scopeToUser
    db.valueCareerNarrative.findUnique({ where: { userId: CURRENT_USER_ID } }),
    db.valueIndustryOpinion.findMany({ where: { userId: CURRENT_USER_ID }, orderBy: { order: "asc" } }), // scopeToUser
    db.valueLinkedInTheme.findMany({ where: { userId: CURRENT_USER_ID }, orderBy: { order: "asc" } }), // scopeToUser
  ]);

  return (
    <>
      <Header title="Values" />
      <div className="p-2xl max-w-[720px] flex flex-col gap-3xl">
        <PrinciplesSection items={principles.map((p) => ({ id: p.id, statement: p.statement, justification: p.justification, order: p.order }))} />
        <NarrativeSection text={narrative?.text ?? ""} />
        <OpinionsSection items={opinions.map((o) => ({ id: o.id, position: o.position, why: o.why, counterargument: o.counterargument, order: o.order }))} />
        <ThemesSection items={themes.map((t) => ({ id: t.id, text: t.text, order: t.order }))} />
      </div>
    </>
  );
}
