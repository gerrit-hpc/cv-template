"use client";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  content: unknown;
  editable?: boolean;
  onChange?: (next: unknown) => void;
}

type Strategy = {
  jdSummary?: unknown;
  strategy?: {
    headlineSummary?: string;
    coverLetterAngle?: { hook?: string; body1?: string; body2?: string; close?: string };
  };
};

export function ProposalCardTailoringStrategy({ content, editable, onChange }: Props) {
  const c = (content ?? {}) as Strategy;
  const original = c.strategy ?? {};
  const [headline, setHeadline] = useState(original.headlineSummary ?? "");
  const [hook, setHook] = useState(original.coverLetterAngle?.hook ?? "");
  const [body1, setBody1] = useState(original.coverLetterAngle?.body1 ?? "");
  const [body2, setBody2] = useState(original.coverLetterAngle?.body2 ?? "");
  const [close, setClose] = useState(original.coverLetterAngle?.close ?? "");

  useEffect(() => {
    if (!editable || !onChange) return;
    onChange({
      ...c,
      strategy: {
        ...c.strategy,
        headlineSummary: headline,
        coverLetterAngle: { hook, body1, body2, close },
      },
    });
    // We deliberately do NOT include c/onChange in the dependency array — c is a fresh
    // object literal on every render so it would re-fire infinitely. The edits flow strictly
    // from local state to onChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable, headline, hook, body1, body2, close]);

  if (!editable) {
    return (
      <div className="flex flex-col gap-sm">
        <Field label="Headline summary" value={original.headlineSummary} />
        <Field label="Cover letter — hook" value={original.coverLetterAngle?.hook} />
        <Field label="Cover letter — body 1" value={original.coverLetterAngle?.body1} />
        <Field label="Cover letter — body 2" value={original.coverLetterAngle?.body2} />
        <Field label="Cover letter — close" value={original.coverLetterAngle?.close} />
        <p className="text-small text-text-tertiary">
          Full strategy (JD summary, experience order, gaps) is read-only here; review it in the
          Tailoring Strategy pane after approval.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-sm">
      <EditField label="Headline summary" value={headline} onChange={setHeadline} />
      <EditField label="Cover letter — hook" value={hook} onChange={setHook} />
      <EditField label="Cover letter — body 1" value={body1} onChange={setBody1} />
      <EditField label="Cover letter — body 2" value={body2} onChange={setBody2} />
      <EditField label="Cover letter — close" value={close} onChange={setClose} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <p className="text-label uppercase text-text-secondary">{label}</p>
      <p className="text-small whitespace-pre-wrap">{value || <span className="text-text-tertiary">—</span>}</p>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-xs">
      <span className="text-label uppercase text-text-secondary">{label}</span>
      <Textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
