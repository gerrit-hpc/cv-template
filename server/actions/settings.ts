"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { ok, type ActionResult } from "@/server/actions/result";

export async function wipeAllData(): Promise<ActionResult<null>> {
  await db.user.deleteMany();
  const seedMod = await import("@/prisma/seed");
  const seed = (seedMod as any).default;
  if (typeof seed === "function") await seed();
  revalidatePath("/", "layout");
  return ok(null);
}
