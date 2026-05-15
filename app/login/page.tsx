"use client";
import { useActionState } from "react";
import { signIn } from "./actions";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import type { ActionResult } from "@/server/actions/result";

const initialState: ActionResult<null> = { ok: true, data: null };

export default function LoginPage() {
  const [state, action] = useActionState(
    async (_: ActionResult<null>, fd: FormData): Promise<ActionResult<null>> => signIn(fd),
    initialState,
  );
  const configured = !!process.env.NEXT_PUBLIC_AUTH_ENABLED;

  if (!configured) {
    return (
      <main className="min-h-screen flex items-center justify-center p-xl">
        <div className="w-[400px] bg-surface rounded-lg border border-border p-xl flex flex-col gap-md">
          <p className="font-mono text-subheading">KB Manager</p>
          <p className="text-body text-text-secondary">Authentication is not configured.</p>
          <a className="text-accent hover:text-accent-hover" href="/profile">Go to profile →</a>
        </div>
      </main>
    );
  }

  const fieldError = state.ok ? undefined : (state.error.fieldErrors?.password ?? state.error.message);
  return (
    <main className="min-h-screen flex items-center justify-center p-xl">
      <form action={action} className="w-[400px] bg-surface rounded-lg border border-border p-xl flex flex-col gap-md">
        <p className="font-mono text-subheading">KB Manager</p>
        <FormField label="Password" name="password" type="password" error={fieldError} />
        <Button type="submit">Sign in</Button>
      </form>
    </main>
  );
}
