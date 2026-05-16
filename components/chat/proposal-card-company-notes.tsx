"use client";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  content: unknown;
  editable?: boolean;
  onChange?: (next: unknown) => void;
}

type Notes = {
  company?: {
    overview?: string;
    products?: string;
    recentSignals?: string;
    leadership?: string;
    reputation?: string;
  };
  role?: { beyondJd?: string; whyRole?: string };
  process?: { logistics?: string };
  calibration?: { justification?: string };
  riskAreas?: string;
};

export function ProposalCardCompanyNotes({ content, editable, onChange }: Props) {
  const c = (content ?? {}) as Notes;
  const [company, setCompany] = useState({
    overview: c.company?.overview ?? "",
    products: c.company?.products ?? "",
    recentSignals: c.company?.recentSignals ?? "",
    leadership: c.company?.leadership ?? "",
    reputation: c.company?.reputation ?? "",
  });
  const [role, setRole] = useState({
    beyondJd: c.role?.beyondJd ?? "",
    whyRole: c.role?.whyRole ?? "",
  });
  const [logistics, setLogistics] = useState(c.process?.logistics ?? "");
  const [justification, setJustification] = useState(c.calibration?.justification ?? "");
  const [riskAreas, setRiskAreas] = useState(c.riskAreas ?? "");

  useEffect(() => {
    if (!editable || !onChange) return;
    onChange({
      ...c,
      company: { ...c.company, ...company },
      role: { ...c.role, ...role },
      process: { ...c.process, logistics },
      calibration: { ...c.calibration, justification },
      riskAreas,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable, company, role, logistics, justification, riskAreas]);

  if (!editable) {
    return (
      <div className="flex flex-col gap-sm">
        <Field label="Company overview" value={c.company?.overview} />
        <Field label="Products" value={c.company?.products} />
        <Field label="Recent signals" value={c.company?.recentSignals} />
        <Field label="Why this role" value={c.role?.whyRole} />
        <Field label="Risk areas" value={c.riskAreas} />
        <p className="text-small text-text-tertiary">
          Process stages, people to meet, and calibration are read-only here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-sm">
      <EditField label="Company overview" value={company.overview} onChange={(v) => setCompany({ ...company, overview: v })} />
      <EditField label="Products" value={company.products} onChange={(v) => setCompany({ ...company, products: v })} />
      <EditField label="Recent signals" value={company.recentSignals} onChange={(v) => setCompany({ ...company, recentSignals: v })} />
      <EditField label="Leadership" value={company.leadership} onChange={(v) => setCompany({ ...company, leadership: v })} />
      <EditField label="Reputation" value={company.reputation} onChange={(v) => setCompany({ ...company, reputation: v })} />
      <EditField label="Beyond the JD" value={role.beyondJd} onChange={(v) => setRole({ ...role, beyondJd: v })} />
      <EditField label="Why this role" value={role.whyRole} onChange={(v) => setRole({ ...role, whyRole: v })} />
      <EditField label="Logistics" value={logistics} onChange={setLogistics} />
      <EditField label="Calibration justification" value={justification} onChange={setJustification} />
      <EditField label="Risk areas" value={riskAreas} onChange={setRiskAreas} />
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
