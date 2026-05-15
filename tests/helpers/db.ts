import { execSync } from "node:child_process";
import { db } from "@/server/data/db";

export async function resetDb() {
  execSync("npx prisma migrate reset --force", {
    stdio: "pipe",
    env: {
      ...process.env,
      PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "yes, reset the temp test database",
    },
  });
  execSync("npx tsx prisma/seed.ts", { stdio: "pipe" });
}

export { db };
