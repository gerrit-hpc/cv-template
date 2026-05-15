"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { SkillSchema } from "@/server/validation/skills";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

function fdToInput(fd: FormData, categoryId: number) {
  return {
    categoryId,
    name: String(fd.get("name") ?? ""),
    proficiency: String(fd.get("proficiency") ?? "proficient") as "familiar" | "proficient" | "expert",
    notes: String(fd.get("notes") ?? "") || null,
    order: Number(fd.get("order") ?? 0),
  };
}

export async function createSkill(categoryId: number, fd: FormData): Promise<ActionResult<{ id: number }>> {
  const parsed = SkillSchema.safeParse(fdToInput(fd, categoryId));
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid skill.", zodToFieldErrors(parsed.error));
  const cat = await db.skillCategory.findFirst({ where: { id: categoryId, userId: CURRENT_USER_ID } }); // scopeToUser
  if (!cat) return err("NOT_FOUND", "Category not found.");
  try {
    const s = await db.skill.create({ data: parsed.data }); // scopeToUser: parent category checked above
    revalidatePath("/skills");
    return ok({ id: s.id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return err("UNIQUE_CONFLICT", "Skill name already exists in this category.", { name: "Already taken" });
    }
    throw e;
  }
}

export async function updateSkill(id: number, fd: FormData): Promise<ActionResult<null>> {
  const existing = await db.skill.findFirst({ // scopeToUser: via category relation
    where: { id, category: { userId: CURRENT_USER_ID } },
    include: { category: true },
  });
  if (!existing) return err("NOT_FOUND", "Skill not found.");
  const parsed = SkillSchema.safeParse(fdToInput(fd, existing.categoryId));
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid skill.", zodToFieldErrors(parsed.error));
  await db.skill.update({ where: { id }, data: parsed.data }); // scopeToUser: pre-checked above
  revalidatePath("/skills");
  return ok(null);
}

export async function deleteSkill(id: number): Promise<ActionResult<null>> {
  const existing = await db.skill.findFirst({ where: { id, category: { userId: CURRENT_USER_ID } } }); // scopeToUser: via category
  if (!existing) return err("NOT_FOUND", "Skill not found.");
  await db.skill.delete({ where: { id } }); // scopeToUser: pre-checked above
  revalidatePath("/skills");
  return ok(null);
}
