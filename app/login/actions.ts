"use server";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionOptions, type SessionData } from "@/server/auth/session";
import { err, ok, type ActionResult } from "@/server/actions/result";

export async function signIn(formData: FormData): Promise<ActionResult<null>> {
  const password = String(formData.get("password") ?? "");
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return err("INTERNAL", "Authentication is not configured.");
  if (!password) return err("VALIDATION_FAILED", "Password is required.", { password: "Password is required" });
  const valid = await bcrypt.compare(password, hash);
  if (!valid) return err("VALIDATION_FAILED", "Invalid password.", { password: "Invalid password" });
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.authenticated = true;
  await session.save();
  redirect("/");
  return ok(null);
}
