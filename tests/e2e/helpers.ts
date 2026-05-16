import { execSync } from "node:child_process";

export function resetDatabase() {
  // `--skip-seed` was removed in Prisma 7; this project's prisma.config.ts
  // does not register a seed runner, so reset already skips seeding.
  execSync("npx prisma migrate reset --force", { stdio: "pipe", env: { ...process.env, PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "yes, reset the temp test database" } });
  execSync("npx tsx prisma/seed.ts", { stdio: "pipe" });
}
