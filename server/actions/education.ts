"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { EducationEntrySchema } from "@/server/validation/education";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

function fdToInput(fd: FormData) {
  return {
    kind: String(fd.get("kind") ?? "degree") as "degree" | "certification" | "course",
    institution: String(fd.get("institution") ?? "") || null,
    name: String(fd.get("name") ?? ""),
    field: String(fd.get("field") ?? "") || null,
    startDate: String(fd.get("startDate") ?? "") || null,
    endDate: String(fd.get("endDate") ?? "") || null,
    notes: String(fd.get("notes") ?? "") || null,
    order: Number(fd.get("order") ?? 0),
  };
}

export async function createEducationEntry(fd: FormData): Promise<ActionResult<{ id: number }>> {
  const parsed = EducationEntrySchema.safeParse(fdToInput(fd));
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid education entry.", zodToFieldErrors(parsed.error));
  const e = await db.educationEntry.create({ data: { ...parsed.data, userId: CURRENT_USER_ID } }); // scopeToUser
  revalidatePath("/education");
  return ok({ id: e.id });
}

export async function updateEducationEntry(id: number, fd: FormData): Promise<ActionResult<null>> {
  const parsed = EducationEntrySchema.safeParse(fdToInput(fd));
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid education entry.", zodToFieldErrors(parsed.error));
  const existing = await db.educationEntry.findFirst({ where: { id, userId: CURRENT_USER_ID } }); // scopeToUser
  if (!existing) return err("NOT_FOUND", "Entry not found.");
  await db.educationEntry.update({ where: { id }, data: parsed.data }); // scopeToUser: pre-checked above
  revalidatePath("/education");
  return ok(null);
}

export async function deleteEducationEntry(id: number): Promise<ActionResult<null>> {
  const existing = await db.educationEntry.findFirst({ where: { id, userId: CURRENT_USER_ID } }); // scopeToUser
  if (!existing) return err("NOT_FOUND", "Entry not found.");
  await db.educationEntry.delete({ where: { id } }); // scopeToUser: pre-checked above
  revalidatePath("/education");
  return ok(null);
}
