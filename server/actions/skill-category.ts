"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { SkillCategorySchema } from "@/server/validation/skills";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

export async function createSkillCategory(fd: FormData): Promise<ActionResult<{ id: number }>> {
  const parsed = SkillCategorySchema.safeParse({ name: String(fd.get("name") ?? ""), order: Number(fd.get("order") ?? 0) });
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid category.", zodToFieldErrors(parsed.error));
  try {
    const c = await db.skillCategory.create({ data: { ...parsed.data, userId: CURRENT_USER_ID } }); // scopeToUser
    revalidatePath("/skills");
    return ok({ id: c.id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return err("UNIQUE_CONFLICT", "Category name already exists.", { name: "Already taken" });
    }
    throw e;
  }
}

export async function updateSkillCategory(id: number, fd: FormData): Promise<ActionResult<null>> {
  const parsed = SkillCategorySchema.safeParse({ name: String(fd.get("name") ?? ""), order: Number(fd.get("order") ?? 0) });
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid category.", zodToFieldErrors(parsed.error));
  const existing = await db.skillCategory.findFirst({ where: { id, userId: CURRENT_USER_ID } }); // scopeToUser
  if (!existing) return err("NOT_FOUND", "Category not found.");
  await db.skillCategory.update({ where: { id }, data: parsed.data }); // scopeToUser: pre-checked above
  revalidatePath("/skills");
  return ok(null);
}

export async function deleteSkillCategory(id: number): Promise<ActionResult<null>> {
  const existing = await db.skillCategory.findFirst({ where: { id, userId: CURRENT_USER_ID } }); // scopeToUser
  if (!existing) return err("NOT_FOUND", "Category not found.");
  await db.skillCategory.delete({ where: { id } }); // scopeToUser: pre-checked above
  revalidatePath("/skills");
  return ok(null);
}
