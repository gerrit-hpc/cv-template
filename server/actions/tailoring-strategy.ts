"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { TailoringStrategyContentSchema, type TailoringStrategyContent } from "@/server/validation/application";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

export async function upsertTailoringStrategy(
  applicationId: number,
  content: TailoringStrategyContent,
): Promise<ActionResult<null>> {
  const parsed = TailoringStrategyContentSchema.safeParse(content);
  if (!parsed.success) return err("VALIDATION_FAILED", "Strategy malformed.", zodToFieldErrors(parsed.error));
  const app = await db.application.findFirst({ where: { id: applicationId, userId: CURRENT_USER_ID } }); // scopeToUser: userId: CURRENT_USER_ID
  if (!app) return err("NOT_FOUND", "Application not found.");
  await db.tailoringStrategy.upsert({ // scopeToUser: applicationId belongs to verified app above
    where: { applicationId },
    create: { applicationId, content: parsed.data as Prisma.InputJsonValue },
    update: { content: parsed.data as Prisma.InputJsonValue },
  });
  revalidatePath(`/applications/${app.slug}`);
  return ok(null);
}

export async function approveTailoringStrategy(applicationId: number): Promise<ActionResult<null>> {
  const app = await db.application.findFirst({ // scopeToUser: userId: CURRENT_USER_ID
    where: { id: applicationId, userId: CURRENT_USER_ID },
    include: { tailoringStrategy: true },
  });
  if (!app) return err("NOT_FOUND", "Application not found.");
  if (!app.tailoringStrategy) return err("NOT_FOUND", "No strategy to approve.");
  await db.tailoringStrategy.update({ where: { applicationId }, data: { approvedAt: new Date() } }); // scopeToUser: applicationId belongs to verified app above
  revalidatePath(`/applications/${app.slug}`);
  return ok(null);
}
