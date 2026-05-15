import { execSync } from "node:child_process";

export function resetDatabase() {
  execSync("npx prisma migrate reset --force --skip-seed", { stdio: "pipe", env: { ...process.env, PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "yes, reset the temp test database" } });
  execSync("npx tsx prisma/seed.ts", { stdio: "pipe" });
}
