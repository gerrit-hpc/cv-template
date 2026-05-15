"use client";
import { useState, useTransition } from "react";
import { upsertTailoringStrategy, approveTailoringStrategy } from "@/server/actions/tailoring-strategy";
import type { TailoringStrategyContent } from "@/server/validation/application";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tag } from "@/components/ui/tag";

const EMPTY: TailoringStrategyContent = {
  jdSummary: { mustHaves: [], niceToHaves: [], signals: [], ambiguities: [] },
  strategy: {
    headlineSummary: "",
    experienceOrder: [],
    skillsLead: [],
    skillsDeprioritize: [],
    coverLetterAngle: { hook: "", body1: "", body2: "", close: "" },
  },
  gaps: [],
};

function StringListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-xs">
      <p className="text-label uppercase text-text-secondary">{label}</p>
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-sm">
          <Input value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <Button variant="ghost" type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}>×</Button>
        </div>
      ))}
      <Button variant="secondary" type="button" onClick={() => onChange([...items, ""])}>Add</Button>
    </div>
  );
}

export function TailoringStrategyPane({
  applicationId,
  strategy,
  approvedAt,
}: {
  applicationId: number;
  strategy: TailoringStrategyContent | null;
  approvedAt: Date | null;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [content, setContent] = useState<TailoringStrategyContent>(strategy ?? EMPTY);

  return (
    <Card>
      <CardHeader
        title="Tailoring strategy"
        actions={
          <>
            {approvedAt ? (
              <span className="text-small text-text-secondary">approved {approvedAt.toISOString().slice(0, 10)}</span>
            ) : strategy ? (
              <Button
                variant="ghost"
                disabled={pending}
                onClick={() => start(async () => { await approveTailoringStrategy(applicationId); })}
              >
                Mark approved
              </Button>
            ) : null}
            {!editing ? <Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button> : null}
          </>
        }
      />
      <CardBody className="flex flex-col gap-lg">
        {!strategy && !editing ? (
          <p className="text-small text-text-secondary">No strategy yet. Will be created by the chat workflow in sub-project 2.</p>
        ) : null}

        {strategy && !editing ? (
          <>
            <section>
              <p className="text-subheading mb-sm">JD summary</p>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <p className="text-label uppercase text-text-secondary">Must-haves</p>
                  <ul className="flex flex-wrap gap-xs mt-xs">{strategy.jdSummary.mustHaves.map((m, i) => <Tag key={i}>{m}</Tag>)}</ul>
                </div>
                <div>
                  <p className="text-label uppercase text-text-secondary">Nice-to-haves</p>
                  <ul className="flex flex-wrap gap-xs mt-xs">{strategy.jdSummary.niceToHaves.map((m, i) => <Tag key={i}>{m}</Tag>)}</ul>
                </div>
                <div>
                  <p className="text-label uppercase text-text-secondary">Signals</p>
                  <ul className="flex flex-col gap-xs mt-xs">{strategy.jdSummary.signals.map((s, i) => <li key={i} className="text-small">{s}</li>)}</ul>
                </div>
                <div>
                  <p className="text-label uppercase text-text-secondary">Ambiguities</p>
                  <ul className="flex flex-col gap-xs mt-xs">{strategy.jdSummary.ambiguities.map((s, i) => <li key={i} className="text-small">{s}</li>)}</ul>
                </div>
              </div>
            </section>
            <section>
              <p className="text-subheading mb-sm">Strategy</p>
              <p className="text-body mb-md">{strategy.strategy.headlineSummary}</p>
              <p className="text-label uppercase text-text-secondary">Cover letter</p>
              <div className="flex flex-col gap-xs mt-xs">
                <p><strong>Hook:</strong> {strategy.strategy.coverLetterAngle.hook}</p>
                <p><strong>Body 1:</strong> {strategy.strategy.coverLetterAngle.body1}</p>
                <p><strong>Body 2:</strong> {strategy.strategy.coverLetterAngle.body2}</p>
                <p><strong>Close:</strong> {strategy.strategy.coverLetterAngle.close}</p>
              </div>
            </section>
            <section>
              <p className="text-subheading mb-sm">Gaps flagged</p>
              {strategy.gaps.length === 0 ? <p className="text-small text-text-tertiary">No gaps flagged.</p> : (
                <table className="w-full text-small">
                  <thead className="text-label uppercase text-text-secondary">
                    <tr><th className="text-left p-xs">Requirement</th><th className="text-left p-xs">Option A</th><th className="text-left p-xs">Option B</th><th className="text-left p-xs">Recommendation</th></tr>
                  </thead>
                  <tbody>
                    {strategy.gaps.map((g, i) => (
                      <tr key={i} className="border-t border-border-subtle"><td className="p-xs">{g.requirement}</td><td className="p-xs">{g.optionA}</td><td className="p-xs">{g.optionB}</td><td className="p-xs">{g.recommendation}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        ) : null}

        {editing ? (
          <div className="flex flex-col gap-lg">
            <section className="flex flex-col gap-md">
              <p className="text-subheading">JD summary</p>
              <StringListEditor label="Must-haves" items={content.jdSummary.mustHaves} onChange={(items) => setContent({ ...content, jdSummary: { ...content.jdSummary, mustHaves: items } })} />
              <StringListEditor label="Nice-to-haves" items={content.jdSummary.niceToHaves} onChange={(items) => setContent({ ...content, jdSummary: { ...content.jdSummary, niceToHaves: items } })} />
              <StringListEditor label="Signals" items={content.jdSummary.signals} onChange={(items) => setContent({ ...content, jdSummary: { ...content.jdSummary, signals: items } })} />
              <StringListEditor label="Ambiguities" items={content.jdSummary.ambiguities} onChange={(items) => setContent({ ...content, jdSummary: { ...content.jdSummary, ambiguities: items } })} />
            </section>
            <section className="flex flex-col gap-md">
              <p className="text-subheading">Strategy</p>
              <Textarea rows={3} value={content.strategy.headlineSummary} placeholder="Headline summary" onChange={(e) => setContent({ ...content, strategy: { ...content.strategy, headlineSummary: e.target.value } })} />
              <StringListEditor label="Skills to lead with" items={content.strategy.skillsLead} onChange={(items) => setContent({ ...content, strategy: { ...content.strategy, skillsLead: items } })} />
              <StringListEditor label="Skills to deprioritize" items={content.strategy.skillsDeprioritize} onChange={(items) => setContent({ ...content, strategy: { ...content.strategy, skillsDeprioritize: items } })} />
              <p className="text-label uppercase text-text-secondary">Cover letter angle</p>
              {(["hook", "body1", "body2", "close"] as const).map((k) => (
                <Textarea key={k} rows={3} placeholder={k} value={content.strategy.coverLetterAngle[k]} onChange={(e) => setContent({ ...content, strategy: { ...content.strategy, coverLetterAngle: { ...content.strategy.coverLetterAngle, [k]: e.target.value } } })} />
              ))}
            </section>
            <section className="flex flex-col gap-md">
              <p className="text-subheading">Gaps</p>
              {content.gaps.map((g, i) => (
                <div key={i} className="flex flex-col gap-xs p-md border border-border rounded-md">
                  <Input placeholder="Requirement" value={g.requirement} onChange={(e) => setContent({ ...content, gaps: content.gaps.map((x, j) => j === i ? { ...x, requirement: e.target.value } : x) })} />
                  <Textarea rows={2} placeholder="Option A" value={g.optionA} onChange={(e) => setContent({ ...content, gaps: content.gaps.map((x, j) => j === i ? { ...x, optionA: e.target.value } : x) })} />
                  <Textarea rows={2} placeholder="Option B" value={g.optionB} onChange={(e) => setContent({ ...content, gaps: content.gaps.map((x, j) => j === i ? { ...x, optionB: e.target.value } : x) })} />
                  <Select value={g.recommendation} onChange={(e) => setContent({ ...content, gaps: content.gaps.map((x, j) => j === i ? { ...x, recommendation: e.target.value as "A" | "B" | "address-head-on" } : x) })}>
                    <option value="A">A</option><option value="B">B</option><option value="address-head-on">Address head-on</option>
                  </Select>
                  <Button variant="ghost" type="button" onClick={() => setContent({ ...content, gaps: content.gaps.filter((_, j) => j !== i) })}>Remove</Button>
                </div>
              ))}
              <Button variant="secondary" type="button" onClick={() => setContent({ ...content, gaps: [...content.gaps, { requirement: "", optionA: "", optionB: "", recommendation: "A" }] })}>Add gap</Button>
            </section>
            <div className="flex justify-end gap-sm">
              <Button variant="ghost" type="button" onClick={() => { setContent(strategy ?? EMPTY); setEditing(false); }}>Cancel</Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() => start(async () => {
                  const r = await upsertTailoringStrategy(applicationId, content);
                  if (r.ok) setEditing(false);
                })}
              >
                Save
              </Button>
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
