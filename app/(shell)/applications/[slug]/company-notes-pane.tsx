"use client";
import { useState, useTransition } from "react";
import { upsertCompanyNotes } from "@/server/actions/company-notes";
import type { CompanyNotesContent } from "@/server/validation/application";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

const EMPTY: CompanyNotesContent = {
  company: { overview: "", products: "", recentSignals: "", leadership: "", reputation: "" },
  role: { beyondJd: "", whyRole: "" },
  process: { stages: [], peopleToMeet: [], logistics: "" },
  calibration: { style: "mixed", difficulty: "mid-rigorous", tone: "casual", justification: "" },
  riskAreas: "",
};

export function CompanyNotesPane({
  applicationId,
  notes,
  lastUpdated,
}: {
  applicationId: number;
  notes: CompanyNotesContent | null;
  lastUpdated: Date | null;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [content, setContent] = useState<CompanyNotesContent>(notes ?? EMPTY);

  return (
    <Card>
      <CardHeader
        title="Company notes"
        actions={
          <>
            {lastUpdated ? <span className="text-small text-text-secondary">updated {lastUpdated.toISOString().slice(0, 10)}</span> : null}
            {!editing ? <Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button> : null}
          </>
        }
      />
      <CardBody className="flex flex-col gap-lg">
        {!notes && !editing ? <p className="text-small text-text-secondary">No company notes yet.</p> : null}
        {notes && !editing ? (
          <>
            <section className="grid grid-cols-2 gap-md">
              <div><p className="text-label uppercase text-text-secondary">Overview</p><p className="text-body">{notes.company.overview}</p></div>
              <div><p className="text-label uppercase text-text-secondary">Products</p><p className="text-body">{notes.company.products}</p></div>
              <div><p className="text-label uppercase text-text-secondary">Recent signals</p><p className="text-body">{notes.company.recentSignals}</p></div>
              <div><p className="text-label uppercase text-text-secondary">Leadership</p><p className="text-body">{notes.company.leadership}</p></div>
              <div className="col-span-2"><p className="text-label uppercase text-text-secondary">Reputation</p><p className="text-body">{notes.company.reputation}</p></div>
            </section>
            <section><p className="text-subheading mb-sm">Calibration</p><div className="flex gap-md"><span className="px-md py-xs rounded-full bg-accent-muted text-accent text-label">{notes.calibration.style}</span><span className="px-md py-xs rounded-full bg-accent-muted text-accent text-label">{notes.calibration.difficulty}</span><span className="px-md py-xs rounded-full bg-accent-muted text-accent text-label">{notes.calibration.tone}</span></div><p className="text-body mt-sm">{notes.calibration.justification}</p></section>
            <section><p className="text-subheading mb-sm">Risk areas</p><p className="text-body">{notes.riskAreas}</p></section>
          </>
        ) : null}

        {editing ? (
          <div className="flex flex-col gap-lg">
            <section className="grid grid-cols-2 gap-md">
              {(["overview", "products", "recentSignals", "leadership", "reputation"] as const).map((k) => (
                <Textarea key={k} rows={3} placeholder={k} value={content.company[k]} onChange={(e) => setContent({ ...content, company: { ...content.company, [k]: e.target.value } })} />
              ))}
            </section>
            <section className="grid grid-cols-2 gap-md">
              <Textarea rows={3} placeholder="Beyond JD" value={content.role.beyondJd} onChange={(e) => setContent({ ...content, role: { ...content.role, beyondJd: e.target.value } })} />
              <Textarea rows={3} placeholder="Why this role" value={content.role.whyRole} onChange={(e) => setContent({ ...content, role: { ...content.role, whyRole: e.target.value } })} />
            </section>
            <section className="flex flex-col gap-md">
              <p className="text-subheading">Calibration</p>
              <Select value={content.calibration.style} onChange={(e) => setContent({ ...content, calibration: { ...content.calibration, style: e.target.value as any } })}>
                <option value="structured-behavioral">structured-behavioral</option><option value="unstructured-conversational">unstructured-conversational</option><option value="case-heavy">case-heavy</option><option value="coding-heavy">coding-heavy</option><option value="culture-heavy">culture-heavy</option><option value="mixed">mixed</option>
              </Select>
              <Select value={content.calibration.difficulty} onChange={(e) => setContent({ ...content, calibration: { ...content.calibration, difficulty: e.target.value as any } })}>
                <option value="junior-screen">junior-screen</option><option value="mid-rigorous">mid-rigorous</option><option value="staff-level-deep-dive">staff-level-deep-dive</option><option value="leadership-fit">leadership-fit</option><option value="hybrid">hybrid</option>
              </Select>
              <Select value={content.calibration.tone} onChange={(e) => setContent({ ...content, calibration: { ...content.calibration, tone: e.target.value as any } })}>
                <option value="formal">formal</option><option value="casual">casual</option><option value="startup-scrappy">startup-scrappy</option><option value="corporate">corporate</option>
              </Select>
              <Textarea rows={3} placeholder="Justification" value={content.calibration.justification} onChange={(e) => setContent({ ...content, calibration: { ...content.calibration, justification: e.target.value } })} />
            </section>
            <Textarea rows={3} placeholder="Risk areas" value={content.riskAreas} onChange={(e) => setContent({ ...content, riskAreas: e.target.value })} />
            <div className="flex justify-end gap-sm">
              <Button variant="ghost" type="button" onClick={() => { setContent(notes ?? EMPTY); setEditing(false); }}>Cancel</Button>
              <Button type="button" disabled={pending} onClick={() => start(async () => { const r = await upsertCompanyNotes(applicationId, content); if (r.ok) setEditing(false); })}>Save</Button>
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
