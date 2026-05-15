"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { JobDescriptionSchema } from "@/server/validation/application";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

export async function upsertJobDescription(applicationId: number, fd: FormData): Promise<ActionResult<null>> {
  const parsed = JobDescriptionSchema.safeParse({
    sourceType: String(fd.get("sourceType") ?? "pasted"),
    sourceValue: String(fd.get("sourceValue") ?? "") || null,
    content: String(fd.get("content") ?? ""),
  });
  if (!parsed.success) return err("VALIDATION_FAILED", "Please fix the JD.", zodToFieldErrors(parsed.error));
  const app = await db.application.findFirst({ where: { id: applicationId, userId: CURRENT_USER_ID } }); // scopeToUser: userId: CURRENT_USER_ID
  if (!app) return err("NOT_FOUND", "Application not found.");
  await db.jobDescription.upsert({ // scopeToUser: applicationId belongs to verified app above
    where: { applicationId },
    create: {
      applicationId,
      sourceType: parsed.data.sourceType,
      sourceValue: parsed.data.sourceValue,
      capturedAt: new Date(),
      content: parsed.data.content,
    },
    update: {
      sourceType: parsed.data.sourceType,
      sourceValue: parsed.data.sourceValue,
      content: parsed.data.content,
    },
  });
  revalidatePath(`/applications/${app.slug}`);
  return ok(null);
}
