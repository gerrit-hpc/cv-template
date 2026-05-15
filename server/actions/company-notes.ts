"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { CompanyNotesContentSchema, type CompanyNotesContent } from "@/server/validation/application";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

export async function upsertCompanyNotes(applicationId: number, content: CompanyNotesContent): Promise<ActionResult<null>> {
  const parsed = CompanyNotesContentSchema.safeParse(content);
  if (!parsed.success) return err("VALIDATION_FAILED", "Notes malformed.", zodToFieldErrors(parsed.error));
  const app = await db.application.findFirst({ where: { id: applicationId, userId: CURRENT_USER_ID } }); // scopeToUser: userId: CURRENT_USER_ID
  if (!app) return err("NOT_FOUND", "Application not found.");
  const now = new Date();
  await db.companyNotes.upsert({ // scopeToUser: applicationId belongs to verified app above
    where: { applicationId },
    create: { applicationId, content: parsed.data as Prisma.InputJsonValue, researchedAt: now, lastUpdated: now },
    update: { content: parsed.data as Prisma.InputJsonValue, lastUpdated: now },
  });
  revalidatePath(`/applications/${app.slug}`);
  return ok(null);
}
