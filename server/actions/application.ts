"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { ApplicationSchema } from "@/server/validation/application";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

function fdToInput(fd: FormData) {
  return {
    slug: String(fd.get("slug") ?? ""),
    company: String(fd.get("company") ?? ""),
    roleTitle: String(fd.get("roleTitle") ?? ""),
    language: String(fd.get("language") ?? "en") as "en" | "de",
  };
}

export async function createApplication(fd: FormData): Promise<ActionResult<{ id: number; slug: string }>> {
  const parsed = ApplicationSchema.safeParse(fdToInput(fd));
  if (!parsed.success) return err("VALIDATION_FAILED", "Please fix the highlighted fields.", zodToFieldErrors(parsed.error));
  try {
    const { id: _ignored, ...createData } = parsed.data;
    const a = await db.application.create({ data: { ...createData, userId: CURRENT_USER_ID } }); // scopeToUser
    revalidatePath("/applications");
    return ok({ id: a.id, slug: a.slug });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return err("UNIQUE_CONFLICT", "Slug already taken.", { slug: "Already taken" });
    }
    throw e;
  }
}

export async function updateApplication(id: number, fd: FormData): Promise<ActionResult<null>> {
  const parsed = ApplicationSchema.safeParse(fdToInput(fd));
  if (!parsed.success) return err("VALIDATION_FAILED", "Please fix the highlighted fields.", zodToFieldErrors(parsed.error));
  const existing = await db.application.findFirst({ where: { id, userId: CURRENT_USER_ID } }); // scopeToUser
  if (!existing) return err("NOT_FOUND", "Application not found.");
  const { id: _ignored, ...updateData } = parsed.data;
  await db.application.update({ where: { id }, data: updateData }); // scopeToUser: pre-checked above
  revalidatePath("/applications");
  return ok(null);
}

export async function setApplicationStatus(
  id: number,
  status: "drafting" | "applied" | "interviewing" | "offer" | "closed",
): Promise<ActionResult<null>> {
  const existing = await db.application.findFirst({ where: { id, userId: CURRENT_USER_ID } }); // scopeToUser
  if (!existing) return err("NOT_FOUND", "Application not found.");
  await db.application.update({ where: { id }, data: { status } }); // scopeToUser: pre-checked above
  revalidatePath("/applications");
  revalidatePath(`/applications/${existing.slug}`);
  return ok(null);
}

export async function deleteApplication(id: number): Promise<ActionResult<null>> {
  const existing = await db.application.findFirst({ where: { id, userId: CURRENT_USER_ID } }); // scopeToUser
  if (!existing) return err("NOT_FOUND", "Application not found.");
  await db.application.delete({ where: { id } }); // scopeToUser: pre-checked above
  revalidatePath("/applications");
  return ok(null);
}
