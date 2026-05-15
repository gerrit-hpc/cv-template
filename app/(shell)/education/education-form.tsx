"use client";
import { useTransition, useState } from "react";
import { createEducationEntry, updateEducationEntry } from "@/server/actions/education";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSelect } from "@/components/forms/form-select";
import { FormDate } from "@/components/forms/form-date";
import { FormNumber } from "@/components/forms/form-number";

export type EducationEntry = {
  id: number;
  kind: "degree" | "certification" | "course";
  institution: string | null;
  name: string;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  order: number;
};

export function EducationForm({
  entry,
  onSaved,
  onCancel,
}: {
  entry: EducationEntry | null;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<EducationEntry["kind"]>(entry?.kind ?? "degree");
  return (
    <form
      action={(fd) =>
        start(async () => {
          const r = entry ? await updateEducationEntry(entry.id, fd) : await createEducationEntry(fd);
          if (r.ok) onSaved?.();
        })
      }
      className="flex flex-col gap-md"
    >
      <FormSelect
        label="Kind"
        name="kind"
        value={kind}
        onChange={(e) => setKind(e.target.value as EducationEntry["kind"])}
        options={[
          { value: "degree", label: "Degree" },
          { value: "certification", label: "Certification" },
          { value: "course", label: "Course" },
        ]}
      />
      <FormField label="Name" name="name" defaultValue={entry?.name ?? ""} />
      <FormField label="Institution" name="institution" defaultValue={entry?.institution ?? ""} />
      {kind === "degree" ? <FormField label="Field" name="field" defaultValue={entry?.field ?? ""} /> : null}
      <div className="grid grid-cols-2 gap-md">
        <FormDate label="Start date" name="startDate" defaultValue={entry?.startDate ?? ""} />
        <FormDate label="End date" name="endDate" defaultValue={entry?.endDate ?? ""} />
      </div>
      <FormTextarea label="Notes" name="notes" rows={3} defaultValue={entry?.notes ?? ""} />
      <FormNumber label="Order" name="order" defaultValue={entry?.order ?? 0} />
      <div className="flex justify-end gap-sm">
        {onCancel ? <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button> : null}
        <Button type="submit" disabled={pending}>{entry ? "Save" : "Add"}</Button>
      </div>
    </form>
  );
}
