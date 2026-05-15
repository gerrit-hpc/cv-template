import { Card, CardHeader, CardBody } from "@/components/ui/card";

type Artifact = {
  kind: "cv" | "cover_letter";
  version: number;
  generatedAt: Date;
  pdfPath: string | null;
};

const LABELS = { cv: "CV", cover_letter: "Cover letter" } as const;

export function ArtifactsPane({ artifacts }: { artifacts: Artifact[] }) {
  return (
    <Card>
      <CardHeader title="Artifacts" />
      <CardBody>
        {artifacts.length === 0 ? (
          <p className="text-small text-text-secondary">No artifacts yet. Regeneration lands in sub-project 3.</p>
        ) : (
          <ul className="flex flex-col gap-sm">
            {artifacts.map((a) => (
              <li key={`${a.kind}-${a.version}`} className="flex items-center justify-between p-sm border-b border-border-subtle">
                <span className="text-body">{LABELS[a.kind]} v{a.version} <span className="text-text-tertiary text-caption">{a.generatedAt.toISOString().slice(0, 10)}</span></span>
                {a.pdfPath ? <a href={a.pdfPath} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-hover">Download PDF</a> : <span className="text-text-tertiary text-small">No PDF</span>}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
