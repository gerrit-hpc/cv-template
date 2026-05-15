"use client";
import { useState, useTransition } from "react";
import { upsertJobDescription } from "@/server/actions/job-description";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms/form-select";
import { FormField } from "@/components/forms/form-field";
import { FormTextarea } from "@/components/forms/form-textarea";
import { MarkdownPreview } from "@/components/sections/markdown-preview";

type JobDescription = {
  sourceType: "url" | "path" | "pasted";
  sourceValue: string | null;
  capturedAt: Date;
  content: string;
} | null;

export function JobDescriptionPane({ applicationId, jd }: { applicationId: number; jd: JobDescription }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Card>
      <CardHeader
        title="Job description"
        actions={
          jd && !editing ? <Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button> : null
        }
      />
      <CardBody>
        {!jd && !editing ? (
          <div className="flex flex-col gap-sm">
            <p className="text-small text-text-secondary">
              No job description yet. Will be created by the chat workflow in sub-project 2.
            </p>
            <Button variant="secondary" onClick={() => setEditing(true)}>Add manually</Button>
          </div>
        ) : null}
        {jd && !editing ? <MarkdownPreview source={jd.content} /> : null}
        {editing ? (
          <form
            action={(fd) =>
              start(async () => {
                const r = await upsertJobDescription(applicationId, fd);
                if (r.ok) setEditing(false);
              })
            }
            className="flex flex-col gap-md"
          >
            <FormSelect
              label="Source type"
              name="sourceType"
              defaultValue={jd?.sourceType ?? "pasted"}
              options={[
                { value: "url", label: "URL" },
                { value: "path", label: "Path" },
                { value: "pasted", label: "Pasted" },
              ]}
            />
            <FormField label="Source value" name="sourceValue" defaultValue={jd?.sourceValue ?? ""} />
            <FormTextarea label="Content (markdown)" name="content" rows={16} defaultValue={jd?.content ?? ""} />
            <div className="flex justify-end gap-sm">
              <Button variant="ghost" type="button" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={pending}>Save</Button>
            </div>
          </form>
        ) : null}
      </CardBody>
    </Card>
  );
}
