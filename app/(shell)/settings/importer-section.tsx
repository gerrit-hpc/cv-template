"use client";
import { useTransition, useState, useEffect } from "react";
import { startImport } from "@/server/actions/importer";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";

type Run = {
  finishedAt: Date | null;
  result: "success" | "partial" | "failed" | "in_progress";
  summary: { counts?: { imported: number; updated: number }; skipped?: { file: string; error: string }[] };
};

export function ImporterSection({ lastRun: initial }: { lastRun: Run | null }) {
  const [pending, start] = useTransition();
  const [path, setPath] = useState("");
  const [run, setRun] = useState(initial);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (!streaming) return;
    const src = new EventSource("/api/import/stream");
    src.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setRun({ finishedAt: data.finishedAt ? new Date(data.finishedAt) : null, result: data.result, summary: data.summary });
      if (data.result !== "in_progress") {
        setStreaming(false);
        src.close();
      }
    };
    return () => src.close();
  }, [streaming]);

  return (
    <Card>
      <CardHeader title="Import from markdown" />
      <CardBody className="flex flex-col gap-md">
        <p className="text-small text-text-secondary">Import your existing cv-template markdown KB into the database.</p>
        <FormField label="Repo path (or set KB_SOURCE_REPO_PATH)" name="repoPath" value={path} onChange={(e) => setPath(e.currentTarget.value)} />
        <div>
          <Button
            disabled={pending || streaming}
            onClick={() =>
              start(async () => {
                setStreaming(true);
                const fd = new FormData();
                fd.set("repoPath", path);
                await startImport(fd);
              })
            }
          >
            {streaming ? "Importing…" : "Run importer"}
          </Button>
        </div>
        {run ? (
          <div className="flex flex-col gap-sm pt-md border-t border-border-subtle">
            <p className="text-body">
              Last import: <strong>{run.result}</strong>
              {run.finishedAt ? <span className="text-text-secondary text-small"> · {run.finishedAt.toISOString()}</span> : null}
            </p>
            {run.summary?.counts ? (
              <p className="text-small">imported {run.summary.counts.imported}, updated {run.summary.counts.updated}</p>
            ) : null}
            {run.summary?.skipped?.length ? (
              <details>
                <summary className="text-small cursor-pointer">{run.summary.skipped.length} files skipped</summary>
                <ul className="mt-sm flex flex-col gap-xs">
                  {run.summary.skipped.map((s, i) => (
                    <li key={i} className="text-caption font-mono">{s.file}: {s.error}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
