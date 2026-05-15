"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/server/data/db";
import { TagSlug } from "@/server/validation/common";
import { z } from "zod";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

const TagSchema = z.object({ slug: TagSlug, label: z.string().min(1, "Label is required") });

export async function createTag(fd: FormData): Promise<ActionResult<null>> {
  const parsed = TagSchema.safeParse({ slug: String(fd.get("slug") ?? ""), label: String(fd.get("label") ?? "") });
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid tag.", zodToFieldErrors(parsed.error));
  try {
    await db.tag.create({ data: parsed.data }); // scopeToUser: tag is a global model, no per-user scoping required
    revalidatePath("/settings");
    return ok(null);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return err("UNIQUE_CONFLICT", "Slug already taken.", { slug: "Already taken" });
    }
    throw e;
  }
}

export async function deleteTag(id: number): Promise<ActionResult<null>> {
  await db.tag.delete({ where: { id } }); // scopeToUser: tag is a global model, no per-user scoping required
  revalidatePath("/settings");
  return ok(null);
}
