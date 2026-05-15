"use client";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useState } from "react";
import { createApplication } from "@/server/actions/application";
import { Header } from "@/components/navigation/header";
import { BackLink } from "@/components/navigation/back-link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { FormSelect } from "@/components/forms/form-select";
import { SlugField } from "@/components/forms/slug-field";
import { slugify } from "@/server/actions/helpers";
import type { ActionResult } from "@/server/actions/result";

const initial: ActionResult<{ id: number; slug: string }> = { ok: true, data: { id: 0, slug: "" } };

export default function NewApplicationPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const derived = slugify(company, roleTitle);
  const [state, action] = useActionState(
    async (_: ActionResult<{ id: number; slug: string }>, fd: FormData): Promise<ActionResult<{ id: number; slug: string }>> => {
      const r = await createApplication(fd);
      if (r.ok) router.push(`/applications/${r.data.slug}` as never);
      return r;
    },
    initial,
  );
  const fe = state.ok ? {} : state.error.fieldErrors ?? {};

  return (
    <>
      <Header title="New application" />
      <div className="p-2xl max-w-[560px] flex flex-col gap-md">
        <BackLink href="/applications" label="Applications" />
        <form action={action} className="flex flex-col gap-md">
          <FormField label="Company" name="company" value={company} onChange={(e) => setCompany(e.currentTarget.value)} error={fe.company} />
          <FormField label="Role title" name="roleTitle" value={roleTitle} onChange={(e) => setRoleTitle(e.currentTarget.value)} error={fe.roleTitle} />
          <FormSelect label="Language" name="language" defaultValue="en" options={[{ value: "en", label: "English" }, { value: "de", label: "Deutsch" }]} error={fe.language} />
          <label className="flex flex-col gap-xs">
            <span className="text-label uppercase text-text-secondary">Slug</span>
            <SlugField name="slug" derivedFrom={derived} />
            {fe.slug ? <span className="text-caption text-danger">{fe.slug}</span> : null}
          </label>
          <Button type="submit">Create</Button>
        </form>
      </div>
    </>
  );
}
