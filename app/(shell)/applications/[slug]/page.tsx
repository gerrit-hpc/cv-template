import { notFound } from "next/navigation";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { BackLink } from "@/components/navigation/back-link";
import { StatusDropdown } from "./status-dropdown";
import { JobDescriptionPane } from "./job-description-pane";
import { TailoringStrategyPane } from "./tailoring-strategy-pane";
import { CompanyNotesPane } from "./company-notes-pane";
import { BriefsPane } from "./briefs-pane";
import { ArtifactsPane } from "./artifacts-pane";
import { ChatPane } from "./chat-pane";
import {
  TailoringStrategyContentSchema,
  CompanyNotesContentSchema,
  InterviewPrepBriefContentSchema,
  type TailoringStrategyContent,
  type CompanyNotesContent,
  type InterviewPrepBriefContent,
} from "@/server/validation/application";
import type { ApplicationStatus } from "@/components/ui/status-badge";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = await db.application.findFirst({ // scopeToUser: scoped via userId
    where: { userId: CURRENT_USER_ID, slug },
    include: {
      jobDescription: true,
      tailoringStrategy: true,
      companyNotes: true,
      interviewPrepBriefs: { orderBy: { generatedAt: "asc" } },
      artifacts: { orderBy: [{ kind: "asc" }, { version: "desc" }] },
    },
  });
  if (!app) notFound();

  const strategy = app.tailoringStrategy
    ? (TailoringStrategyContentSchema.parse(app.tailoringStrategy.content) as TailoringStrategyContent)
    : null;
  const notes = app.companyNotes
    ? (CompanyNotesContentSchema.parse(app.companyNotes.content) as CompanyNotesContent)
    : null;
  const briefs = app.interviewPrepBriefs.map((b) => ({
    stageName: b.stageName,
    generatedAt: b.generatedAt,
    content: InterviewPrepBriefContentSchema.parse(b.content) as InterviewPrepBriefContent,
  }));

  return (
    <>
      <Header
        title={`${app.company} — ${app.roleTitle}`}
        actions={<StatusDropdown applicationId={app.id} status={app.status as ApplicationStatus} />}
      />
      <div className="p-2xl flex flex-col gap-lg">
        <BackLink href="/applications" label="Applications" />
        <JobDescriptionPane
          applicationId={app.id}
          jd={app.jobDescription ? {
            sourceType: app.jobDescription.sourceType,
            sourceValue: app.jobDescription.sourceValue,
            capturedAt: app.jobDescription.capturedAt,
            content: app.jobDescription.content,
          } : null}
        />
        <TailoringStrategyPane applicationId={app.id} strategy={strategy} approvedAt={app.tailoringStrategy?.approvedAt ?? null} />
        <CompanyNotesPane applicationId={app.id} notes={notes} lastUpdated={app.companyNotes?.lastUpdated ?? null} />
        <BriefsPane applicationId={app.id} briefs={briefs} />
        <ArtifactsPane artifacts={app.artifacts.map((a) => ({ kind: a.kind as "cv" | "cover_letter", version: a.version, generatedAt: a.generatedAt, pdfPath: a.pdfPath }))} />
        <ChatPane applicationId={app.id} applicationSlug={app.slug} />
      </div>
    </>
  );
}
