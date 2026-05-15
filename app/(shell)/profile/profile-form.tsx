"use client";
import { useActionState } from "react";
import { upsertProfile } from "@/server/actions/profile";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { FormTextarea } from "@/components/forms/form-textarea";
import type { ActionResult } from "@/server/actions/result";

type Profile = {
  fullName: string;
  headline: string;
  locationCity: string | null;
  locationCountry: string | null;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  professionalSummary: string;
} | null;

const initial: ActionResult<{ id: number }> = { ok: true, data: { id: 0 } };

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(
    async (_: ActionResult<{ id: number }>, fd: FormData) => upsertProfile(fd),
    initial,
  );
  const fe = state.ok ? {} : state.error.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-md">
      <SectionHeader title="Identity" actions={<Button type="submit">Save</Button>} />
      <div className="grid grid-cols-2 gap-md">
        <FormField label="Full name" name="fullName" defaultValue={profile?.fullName ?? ""} error={fe.fullName} />
        <FormField label="Headline" name="headline" defaultValue={profile?.headline ?? ""} error={fe.headline} />
        <FormField label="Email" name="email" type="email" defaultValue={profile?.email ?? ""} error={fe.email} />
        <FormField label="Phone" name="phone" defaultValue={profile?.phone ?? ""} error={fe.phone} />
        <FormField label="City" name="locationCity" defaultValue={profile?.locationCity ?? ""} error={fe.locationCity} />
        <FormField label="Country" name="locationCountry" defaultValue={profile?.locationCountry ?? ""} error={fe.locationCountry} />
        <FormField label="LinkedIn URL" name="linkedinUrl" defaultValue={profile?.linkedinUrl ?? ""} error={fe.linkedinUrl} />
        <FormField label="GitHub URL" name="githubUrl" defaultValue={profile?.githubUrl ?? ""} error={fe.githubUrl} />
        <FormField label="Website URL" name="websiteUrl" defaultValue={profile?.websiteUrl ?? ""} error={fe.websiteUrl} />
      </div>
      <FormTextarea
        label="Professional summary"
        name="professionalSummary"
        rows={8}
        defaultValue={profile?.professionalSummary ?? ""}
        error={fe.professionalSummary}
      />
    </form>
  );
}
