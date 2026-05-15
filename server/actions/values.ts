"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import {
  PrincipleSchema, CareerNarrativeSchema, IndustryOpinionSchema, LinkedInThemeSchema,
  type PrincipleInput, type IndustryOpinionInput, type LinkedInThemeInput,
} from "@/server/validation/values";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

export async function setPrinciples(items: PrincipleInput[]): Promise<ActionResult<null>> {
  for (const i of items) {
    const r = PrincipleSchema.safeParse(i);
    if (!r.success) return err("VALIDATION_FAILED", "Invalid principle.", zodToFieldErrors(r.error));
  }
  // scopeToUser: bulk replace of current user's principles
  await db.$transaction([
    db.valuePrinciple.deleteMany({ where: { userId: CURRENT_USER_ID } }),
    db.valuePrinciple.createMany({
      data: items.map((i) => ({ statement: i.statement, justification: i.justification, order: i.order, userId: CURRENT_USER_ID })),
    }),
  ]);
  revalidatePath("/values");
  return ok(null);
}

export async function setCareerNarrative(fd: FormData): Promise<ActionResult<null>> {
  const parsed = CareerNarrativeSchema.safeParse({ text: String(fd.get("text") ?? "") });
  if (!parsed.success) return err("VALIDATION_FAILED", "Narrative required.", zodToFieldErrors(parsed.error));
  // scopeToUser: one-per-user upsert via userId where clause
  await db.valueCareerNarrative.upsert({
    where: { userId: CURRENT_USER_ID },
    create: { userId: CURRENT_USER_ID, text: parsed.data.text },
    update: { text: parsed.data.text },
  });
  revalidatePath("/values");
  return ok(null);
}

export async function setIndustryOpinions(items: IndustryOpinionInput[]): Promise<ActionResult<null>> {
  for (const i of items) {
    const r = IndustryOpinionSchema.safeParse(i);
    if (!r.success) return err("VALIDATION_FAILED", "Invalid opinion.", zodToFieldErrors(r.error));
  }
  // scopeToUser: bulk replace of current user's opinions
  await db.$transaction([
    db.valueIndustryOpinion.deleteMany({ where: { userId: CURRENT_USER_ID } }),
    db.valueIndustryOpinion.createMany({
      data: items.map((i) => ({ position: i.position, why: i.why, counterargument: i.counterargument, order: i.order, userId: CURRENT_USER_ID })),
    }),
  ]);
  revalidatePath("/values");
  return ok(null);
}

export async function setLinkedInThemes(items: LinkedInThemeInput[]): Promise<ActionResult<null>> {
  for (const i of items) {
    const r = LinkedInThemeSchema.safeParse(i);
    if (!r.success) return err("VALIDATION_FAILED", "Invalid theme.", zodToFieldErrors(r.error));
  }
  // scopeToUser: bulk replace of current user's themes
  await db.$transaction([
    db.valueLinkedInTheme.deleteMany({ where: { userId: CURRENT_USER_ID } }),
    db.valueLinkedInTheme.createMany({
      data: items.map((i) => ({ text: i.text, order: i.order, userId: CURRENT_USER_ID })),
    }),
  ]);
  revalidatePath("/values");
  return ok(null);
}
