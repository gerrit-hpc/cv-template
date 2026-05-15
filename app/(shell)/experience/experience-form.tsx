"use client";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createRole, updateRole, deleteRole } from "@/server/actions/experience";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSelect } from "@/components/forms/form-select";
import { FormCheckbox } from "@/components/forms/form-checkbox";
import { FormDate } from "@/components/forms/form-date";
import { SlugField } from "@/components/forms/slug-field";
import { TagSelector } from "@/components/forms/tag-selector";
import { slugify } from "@/server/actions/helpers";
import type { ActionResult } from "@/server/actions/result";

type Role = {
  id: number;
  slug: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  employmentType: "full_time" | "part_time" | "contract" | "internship";
  companyUrl: string | null;
  overview: string;
  scopeTeamSize: string | null;
  scopeReportingTo: string | null;
  scopeTechStack: string | null;
  scopeBudget: string | null;
  isHighlightsOnly: boolean;
  tags: { tag: { slug: string; label: string } }[];
} | null;

type AvailableTag = { slug: string; label: string };

const initial: ActionResult<{ id: number; slug: string }> = { ok: true, data: { id: 0, slug: "" } };

export function ExperienceForm({
  mode,
  role,
  availableTags,
}: {
  mode: "create" | "edit";
  role: Role;
  availableTags: AvailableTag[];
}) {
  const router = useRouter();
  const [company, setCompany] = useState(role?.company ?? "");
  const [title, setTitle] = useState(role?.title ?? "");
  const derived = slugify(company, title);
  const [state, action] = useActionState(
    async (_: ActionResult<{ id: number; slug: string }>, fd: FormData): Promise<ActionResult<{ id: number; slug: string }>> => {
      const res = mode === "create" ? await createRole(fd) : await updateRole(role!.id, fd);
      if (res.ok && mode === "create") router.push(`/experience/${res.data.slug}` as never);
      return res;
    },
    initial,
  );
  const fe = state.ok ? {} : state.error.fieldErrors ?? {};
  const [pending, start] = useTransition();

  return (
    <form action={action} className="flex flex-col gap-md">
      <SectionHeader
        title={mode === "create" ? "New role" : "Role details"}
        actions={
          <>
            {mode === "edit" && role ? (
              <Button
                variant="ghost"
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await deleteRole(role.id);
                    router.push("/experience" as never);
                  })
                }
              >
                Delete role
              </Button>
            ) : null}
            <Button type="submit">Save</Button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-md">
        <FormField label="Company" name="company" defaultValue={company} onChange={(e) => setCompany(e.currentTarget.value)} error={fe.company} />
        <FormField label="Title" name="title" defaultValue={title} onChange={(e) => setTitle(e.currentTarget.value)} error={fe.title} />
        <FormDate label="Start date" name="startDate" defaultValue={role?.startDate ?? ""} error={fe.startDate} />
        <FormDate label="End date" name="endDate" defaultValue={role?.endDate ?? ""} error={fe.endDate} />
        <FormField label="Location" name="location" defaultValue={role?.location ?? ""} error={fe.location} />
        <FormSelect
          label="Employment type"
          name="employmentType"
          defaultValue={role?.employmentType ?? "full_time"}
          options={[
            { value: "full_time", label: "Full-time" },
            { value: "part_time", label: "Part-time" },
            { value: "contract", label: "Contract" },
            { value: "internship", label: "Internship" },
          ]}
          error={fe.employmentType}
        />
        <FormField label="Company URL" name="companyUrl" defaultValue={role?.companyUrl ?? ""} error={fe.companyUrl} />
        <label className="flex flex-col gap-xs">
          <span className="text-label uppercase text-text-secondary">Slug</span>
          <SlugField name="slug" defaultValue={role?.slug ?? ""} derivedFrom={mode === "create" ? derived : undefined} />
          {fe.slug ? <span className="text-caption text-danger">{fe.slug}</span> : null}
        </label>
      </div>
      <FormField label="Team size" name="scopeTeamSize" defaultValue={role?.scopeTeamSize ?? ""} error={fe.scopeTeamSize} />
      <FormField label="Reporting to" name="scopeReportingTo" defaultValue={role?.scopeReportingTo ?? ""} error={fe.scopeReportingTo} />
      <FormField label="Budget" name="scopeBudget" defaultValue={role?.scopeBudget ?? ""} error={fe.scopeBudget} />
      <FormTextarea label="Tech stack" name="scopeTechStack" rows={3} defaultValue={role?.scopeTechStack ?? ""} error={fe.scopeTechStack} />
      <FormTextarea label="Overview" name="overview" rows={6} defaultValue={role?.overview ?? ""} error={fe.overview} />
      <FormCheckbox label="Highlights only (older role — no per-achievement entries)" name="isHighlightsOnly" defaultChecked={role?.isHighlightsOnly ?? false} />
      <div>
        <p className="text-label uppercase text-text-secondary mb-xs">Tags</p>
        <TagSelector name="tagSlugs" available={availableTags} selected={role?.tags.map((t) => t.tag.slug) ?? []} />
      </div>
    </form>
  );
}
