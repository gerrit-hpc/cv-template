"use client";
import { useActionState } from "react";
import { setCareerNarrative } from "@/server/actions/values";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { FormTextarea } from "@/components/forms/form-textarea";
import type { ActionResult } from "@/server/actions/result";

const initial: ActionResult<null> = { ok: true, data: null };

export function NarrativeSection({ text }: { text: string }) {
  const [state, action] = useActionState(
    async (_: ActionResult<null>, fd: FormData): Promise<ActionResult<null>> => setCareerNarrative(fd),
    initial,
  );
  const fe = state.ok ? {} : state.error.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-md">
      <SectionHeader title="Career narrative" actions={<Button type="submit">Save</Button>} />
      <FormTextarea label="Narrative" name="text" rows={12} defaultValue={text} error={fe.text} />
    </form>
  );
}
