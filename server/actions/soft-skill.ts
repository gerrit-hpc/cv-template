"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { SoftSkillSchema } from "@/server/validation/skills";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

function fdToInput(fd: FormData) {
  const tagCsv = String(fd.get("tagSlugs") ?? "");
  return {
    name: String(fd.get("name") ?? ""),
    whereDemonstrated: String(fd.get("whereDemonstrated") ?? ""),
    whatHappened: String(fd.get("whatHappened") ?? ""),
    order: Number(fd.get("order") ?? 0),
    tagSlugs: tagCsv ? tagCsv.split(",").map((s) => s.trim()).filter(Boolean) : [],
  };
}

async function setTags(softSkillId: number, tagSlugs: string[]) {
  const tags = await db.tag.findMany({ where: { slug: { in: tagSlugs } } });
  // scopeToUser: softSkillId belongs to current user (pre-verified by caller)
  await db.$transaction([
    db.softSkillTag.deleteMany({ where: { softSkillId } }),
    db.softSkillTag.createMany({ data: tags.map((t) => ({ softSkillId, tagId: t.id })) }),
  ]);
}

export async function createSoftSkill(fd: FormData): Promise<ActionResult<{ id: number }>> {
  const parsed = SoftSkillSchema.safeParse(fdToInput(fd));
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid soft skill.", zodToFieldErrors(parsed.error));
  const { tagSlugs, ...data } = parsed.data;
  const s = await db.softSkill.create({ data: { ...data, userId: CURRENT_USER_ID } }); // scopeToUser
  await setTags(s.id, tagSlugs);
  revalidatePath("/skills");
  return ok({ id: s.id });
}

export async function updateSoftSkill(id: number, fd: FormData): Promise<ActionResult<null>> {
  const parsed = SoftSkillSchema.safeParse(fdToInput(fd));
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid soft skill.", zodToFieldErrors(parsed.error));
  const existing = await db.softSkill.findFirst({ where: { id, userId: CURRENT_USER_ID } }); // scopeToUser
  if (!existing) return err("NOT_FOUND", "Soft skill not found.");
  const { tagSlugs, ...data } = parsed.data;
  await db.softSkill.update({ where: { id }, data }); // scopeToUser: pre-checked above
  await setTags(id, tagSlugs);
  revalidatePath("/skills");
  return ok(null);
}

export async function deleteSoftSkill(id: number): Promise<ActionResult<null>> {
  const existing = await db.softSkill.findFirst({ where: { id, userId: CURRENT_USER_ID } }); // scopeToUser
  if (!existing) return err("NOT_FOUND", "Soft skill not found.");
  await db.softSkill.delete({ where: { id } }); // scopeToUser: pre-checked above
  revalidatePath("/skills");
  return ok(null);
}
