import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const db = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

const DEFAULT_TAGS = [
  { slug: "leadership", label: "Leadership" },
  { slug: "technical", label: "Technical" },
  { slug: "strategy", label: "Strategy" },
  { slug: "delivery", label: "Delivery" },
  { slug: "culture", label: "Culture" },
  { slug: "growth", label: "Growth" },
  { slug: "innovation", label: "Innovation" },
];

const DEFAULT_SKILL_CATEGORIES = [
  "Languages",
  "Infrastructure & Platforms",
  "Architecture & Design",
  "AI & Developer Experience",
  "Methods & Practices",
];

async function main() {
  const user = await db.user.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  for (const tag of DEFAULT_TAGS) {
    await db.tag.upsert({
      where: { slug: tag.slug },
      update: { label: tag.label },
      create: tag,
    });
  }

  let order = 0;
  for (const name of DEFAULT_SKILL_CATEGORIES) {
    await db.skillCategory.upsert({
      where: { userId_name: { userId: user.id, name } },
      update: { order },
      create: { userId: user.id, name, order },
    });
    order += 1;
  }

  console.log("Seeded user", user.id, "tags", DEFAULT_TAGS.length, "categories", DEFAULT_SKILL_CATEGORIES.length);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
