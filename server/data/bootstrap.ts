import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";

export async function decideHomeRedirect(): Promise<string> {
  const profile = await db.profile.findUnique({ where: { userId: CURRENT_USER_ID } });
  return profile ? "/applications" : "/profile";
}
