"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { InterviewPrepBriefContentSchema, type InterviewPrepBriefContent } from "@/server/validation/application";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

export async function upsertInterviewPrepBrief(
  applicationId: number,
  stageName: string,
  content: InterviewPrepBriefContent,
): Promise<ActionResult<null>> {
  if (!stageName.match(/^[a-z0-9-]+$/)) {
    return err("VALIDATION_FAILED", "Stage name must be kebab-case.", { stageName: "Invalid" });
  }
  const parsed = InterviewPrepBriefContentSchema.safeParse(content);
  if (!parsed.success) return err("VALIDATION_FAILED", "Brief malformed.", zodToFieldErrors(parsed.error));
  const app = await db.application.findFirst({ where: { id: applicationId, userId: CURRENT_USER_ID } }); // scopeToUser: userId: CURRENT_USER_ID
  if (!app) return err("NOT_FOUND", "Application not found.");
  await db.interviewPrepBrief.upsert({ // scopeToUser: applicationId belongs to verified app above
    where: { applicationId_stageName: { applicationId, stageName } },
    create: { applicationId, stageName, content: parsed.data as Prisma.InputJsonValue, generatedAt: new Date() },
    update: { content: parsed.data as Prisma.InputJsonValue, generatedAt: new Date() },
  });
  revalidatePath(`/applications/${app.slug}`);
  return ok(null);
}

export async function deleteInterviewPrepBrief(applicationId: number, stageName: string): Promise<ActionResult<null>> {
  const app = await db.application.findFirst({ where: { id: applicationId, userId: CURRENT_USER_ID } }); // scopeToUser: userId: CURRENT_USER_ID
  if (!app) return err("NOT_FOUND", "Application not found.");
  await db.interviewPrepBrief.delete({ where: { applicationId_stageName: { applicationId, stageName } } }); // scopeToUser: applicationId belongs to verified app above
  revalidatePath(`/applications/${app.slug}`);
  return ok(null);
}
