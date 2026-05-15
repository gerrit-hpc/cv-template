import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { resetDb, db } from "@/tests/helpers/db";

describe("application actions", () => {
  beforeAll(async () => resetDb(), 60_000);
  afterAll(async () => db.$disconnect());
  beforeEach(async () => { await db.application.deleteMany(); });

  it("createApplication creates a row", async () => {
    const { createApplication } = await import("@/server/actions/application");
    const fd = new FormData();
    fd.set("slug", "acme-engineer"); fd.set("company", "Acme"); fd.set("roleTitle", "Engineer"); fd.set("language", "en");
    const r = await createApplication(fd);
    expect(r.ok).toBe(true);
    const app = await db.application.findFirst({ where: { slug: "acme-engineer" } });
    expect(app?.status).toBe("drafting");
  });

  it("createApplication rejects duplicate slug", async () => {
    const { createApplication } = await import("@/server/actions/application");
    const make = () => {
      const fd = new FormData();
      fd.set("slug", "x"); fd.set("company", "X"); fd.set("roleTitle", "Y"); fd.set("language", "en");
      return fd;
    };
    await createApplication(make());
    const r = await createApplication(make());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("UNIQUE_CONFLICT");
  });

  it("setApplicationStatus updates the status", async () => {
    const { createApplication, setApplicationStatus } = await import("@/server/actions/application");
    const fd = new FormData();
    fd.set("slug", "a"); fd.set("company", "A"); fd.set("roleTitle", "B"); fd.set("language", "en");
    await createApplication(fd);
    const app = await db.application.findFirstOrThrow();
    const r = await setApplicationStatus(app.id, "applied");
    expect(r.ok).toBe(true);
    const updated = await db.application.findUnique({ where: { id: app.id } });
    expect(updated?.status).toBe("applied");
  });

  it("deleteApplication cascades", async () => {
    const { createApplication, deleteApplication } = await import("@/server/actions/application");
    const fd = new FormData();
    fd.set("slug", "z"); fd.set("company", "Z"); fd.set("roleTitle", "X"); fd.set("language", "en");
    await createApplication(fd);
    const app = await db.application.findFirstOrThrow();
    await deleteApplication(app.id);
    expect(await db.application.count()).toBe(0);
  });
});
