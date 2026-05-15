"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { ok, err, type ActionResult } from "@/server/actions/result";

export async function setSkillApplications(skillId: number, roleIds: number[]): Promise<ActionResult<null>> {
  const skill = await db.skill.findFirst({ where: { id: skillId, category: { userId: CURRENT_USER_ID } } }); // scopeToUser: via category
  if (!skill) return err("NOT_FOUND", "Skill not found.");
  const validRoles = await db.experienceRole.findMany({ where: { id: { in: roleIds }, userId: CURRENT_USER_ID }, select: { id: true } }); // scopeToUser
  const validIds = new Set(validRoles.map((r) => r.id));
  // scopeToUser: skill verified above, only valid (user-owned) roleIds inserted
  await db.$transaction([
    db.skillApplication.deleteMany({ where: { skillId } }),
    db.skillApplication.createMany({ data: [...validIds].map((roleId) => ({ skillId, roleId })) }),
  ]);
  revalidatePath("/skills");
  revalidatePath("/experience", "layout");
  return ok(null);
}
