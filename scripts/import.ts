import { runImport } from "@/server/importer/run";
import { db } from "@/server/data/db";

async function main() {
  const args = process.argv.slice(2);
  const repoPath = args.find((a) => !a.startsWith("--"));
  if (!repoPath) {
    console.error(
      "Usage: npm run import -- <path-to-cv-template-repo> [--clean]"
    );
    process.exit(1);
  }
  const clean = args.includes("--clean");
  if (clean) {
    console.log("--clean: wiping all rows…");
    await db.application.deleteMany();
    await db.experienceRole.deleteMany();
    await db.skill.deleteMany();
    await db.skillCategory.deleteMany();
    await db.softSkill.deleteMany();
    await db.educationEntry.deleteMany();
    await db.valuePrinciple.deleteMany();
    await db.valueIndustryOpinion.deleteMany();
    await db.valueLinkedInTheme.deleteMany();
    await db.valueCareerNarrative.deleteMany();
    await db.profile.deleteMany();
  }
  const r = await runImport(repoPath);
  console.log(`result: ${r.result}`);
  console.log(`imported: ${r.imported}, updated: ${r.updated}`);
  if (r.skipped.length) {
    console.log(`\nskipped:`);
    for (const s of r.skipped) console.log(`  ${s.file}: ${s.error}`);
  }
  await db.$disconnect();
  process.exit(r.result === "failed" && r.imported === 0 ? 1 : 0);
}

main();
