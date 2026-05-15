"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { runImport } from "@/server/importer/run";
import { ok, err, type ActionResult } from "@/server/actions/result";

export async function startImport(fd: FormData): Promise<ActionResult<{ runId: number }>> {
  const repoPath = String(fd.get("repoPath") ?? "") || process.env.KB_SOURCE_REPO_PATH;
  if (!repoPath) return err("VALIDATION_FAILED", "Set KB_SOURCE_REPO_PATH or provide a path.", { repoPath: "Required" });
  const run = await db.importRun.create({ // scopeToUser: userId: CURRENT_USER_ID is set explicitly below
    data: { userId: CURRENT_USER_ID, sourcePath: repoPath, result: "in_progress", summary: { phase: "starting" } },
  });
  try {
    const report = await runImport(repoPath);
    await db.importRun.update({ // scopeToUser: scoped by id from the run created above with CURRENT_USER_ID
      where: { id: run.id },
      data: { finishedAt: new Date(), result: report.result, summary: { counts: { imported: report.imported, updated: report.updated }, skipped: report.skipped } },
    });
    revalidatePath("/settings");
    return ok({ runId: run.id });
  } catch (e) {
    await db.importRun.update({ // scopeToUser: scoped by id from the run created above with CURRENT_USER_ID
      where: { id: run.id },
      data: { finishedAt: new Date(), result: "failed", summary: { error: e instanceof Error ? e.message : String(e) } },
    });
    return err("INTERNAL", "Import crashed.");
  }
}
