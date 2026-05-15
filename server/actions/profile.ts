"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import {
  ProfileSchema,
  KeyQualificationSchema,
  LanguageSchema,
  type KeyQualificationInput,
  type LanguageInput,
} from "@/server/validation/profile";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

function fdToProfileInput(fd: FormData) {
  return {
    fullName: String(fd.get("fullName") ?? ""),
    headline: String(fd.get("headline") ?? ""),
    locationCity: String(fd.get("locationCity") ?? "") || null,
    locationCountry: String(fd.get("locationCountry") ?? "") || null,
    email: String(fd.get("email") ?? ""),
    phone: String(fd.get("phone") ?? "") || null,
    linkedinUrl: String(fd.get("linkedinUrl") ?? "") || null,
    githubUrl: String(fd.get("githubUrl") ?? "") || null,
    websiteUrl: String(fd.get("websiteUrl") ?? "") || null,
    professionalSummary: String(fd.get("professionalSummary") ?? ""),
  };
}

export async function upsertProfile(fd: FormData): Promise<ActionResult<{ id: number }>> {
  const parsed = ProfileSchema.safeParse(fdToProfileInput(fd));
  if (!parsed.success)
    return err("VALIDATION_FAILED", "Please fix the highlighted fields.", zodToFieldErrors(parsed.error));
  const data = parsed.data;
  const row = await db.profile.upsert({
    where: { userId: CURRENT_USER_ID },
    create: { ...data, userId: CURRENT_USER_ID },
    update: data,
  });
  revalidatePath("/profile");
  return ok({ id: row.id });
}

export async function setKeyQualifications(items: KeyQualificationInput[]): Promise<ActionResult<null>> {
  for (const item of items) {
    const r = KeyQualificationSchema.safeParse(item);
    if (!r.success) return err("VALIDATION_FAILED", "Invalid qualification.", zodToFieldErrors(r.error));
  }
  const profile = await db.profile.findUnique({ where: { userId: CURRENT_USER_ID } });
  if (!profile) return err("NOT_FOUND", "Profile does not exist yet.");
  await db.$transaction([
    db.keyQualification.deleteMany({ where: { profileId: profile.id } }), // scopeToUser: profile.id (one-per-user)
    db.keyQualification.createMany({ // scopeToUser: profile.id (one-per-user)
      data: items.map((i) => ({ text: i.text, order: i.order, profileId: profile.id })),
    }),
  ]);
  revalidatePath("/profile");
  return ok(null);
}

export async function setLanguages(items: LanguageInput[]): Promise<ActionResult<null>> {
  for (const item of items) {
    const r = LanguageSchema.safeParse(item);
    if (!r.success) return err("VALIDATION_FAILED", "Invalid language.", zodToFieldErrors(r.error));
  }
  const profile = await db.profile.findUnique({ where: { userId: CURRENT_USER_ID } });
  if (!profile) return err("NOT_FOUND", "Profile does not exist yet.");
  await db.$transaction([
    db.language.deleteMany({ where: { profileId: profile.id } }), // scopeToUser: profile.id (one-per-user)
    db.language.createMany({ // scopeToUser: profile.id (one-per-user)
      data: items.map((i) => ({ name: i.name, proficiency: i.proficiency, order: i.order, profileId: profile.id })),
    }),
  ]);
  revalidatePath("/profile");
  return ok(null);
}
