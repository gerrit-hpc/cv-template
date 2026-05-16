"use client";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  content: unknown;
  editable?: boolean;
  onChange?: (next: unknown) => void;
}

type Brief = {
  stageContext?: string;
  toughQuestions?: string;
  logistics?: string;
};

// Save_brief args are wrapped: { stageName, content }. Approve endpoint also accepts that shape.
function unwrap(content: unknown): { stageName?: string; brief: Brief & Record<string, unknown> } {
  if (content && typeof content === "object" && "content" in (content as object) && "stageName" in (content as object)) {
    const wrapped = content as { stageName?: string; content?: Brief };
    return { stageName: wrapped.stageName, brief: (wrapped.content ?? {}) as Brief };
  }
  return { brief: (content ?? {}) as Brief };
}

export function ProposalCardBrief({ content, editable, onChange }: Props) {
  const { stageName, brief } = unwrap(content);
  const [stageContext, setStageContext] = useState(brief.stageContext ?? "");
  const [toughQuestions, setToughQuestions] = useState(brief.toughQuestions ?? "");
  const [logistics, setLogistics] = useState(brief.logistics ?? "");

  useEffect(() => {
    if (!editable || !onChange) return;
    onChange({
      stageName,
      content: {
        ...brief,
        stageContext,
        toughQuestions,
        logistics,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable, stageContext, toughQuestions, logistics]);

  if (!editable) {
    return (
      <div className="flex flex-col gap-sm">
        {stageName && (
          <p className="text-small text-text-secondary">
            Stage: <span className="text-text">{stageName}</span>
          </p>
        )}
        <Field label="Stage context" value={brief.stageContext} />
        <Field label="Tough questions" value={brief.toughQuestions} />
        <Field label="Logistics" value={brief.logistics} />
        <p className="text-small text-text-tertiary">
          Anchor stories, question clusters, and questions-to-ask are read-only here; revise them
          in the Briefs pane after approval.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-sm">
      {stageName && (
        <p className="text-small text-text-secondary">
          Stage: <span className="text-text">{stageName}</span>
        </p>
      )}
      <EditField label="Stage context" value={stageContext} onChange={setStageContext} />
      <EditField label="Tough questions" value={toughQuestions} onChange={setToughQuestions} />
      <EditField label="Logistics" value={logistics} onChange={setLogistics} />
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
      <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
