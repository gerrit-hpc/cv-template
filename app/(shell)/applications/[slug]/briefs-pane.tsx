"use client";
import { useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import type { InterviewPrepBriefContent } from "@/server/validation/application";

type Brief = {
  stageName: string;
  generatedAt: Date;
  content: InterviewPrepBriefContent;
};

export function BriefsPane({ briefs }: { applicationId: number; briefs: Brief[] }) {
  const [openStage, setOpenStage] = useState<string | null>(null);
  return (
    <Card>
      <CardHeader title="Interview prep briefs" />
      <CardBody className="flex flex-col gap-md">
        {briefs.length === 0 ? (
          <p className="text-small text-text-secondary">No briefs yet.</p>
        ) : (
          briefs.map((b) => (
            <div key={b.stageName} className="border border-border-subtle rounded-md">
              <button type="button" className="w-full flex items-center justify-between p-md hover:bg-surface-raised" onClick={() => setOpenStage(openStage === b.stageName ? null : b.stageName)}>
                <span className="text-subheading">{b.stageName}</span>
                <span className="text-caption text-text-tertiary">generated {b.generatedAt.toISOString().slice(0, 10)}</span>
              </button>
              {openStage === b.stageName ? (
                <div className="p-md border-t border-border-subtle flex flex-col gap-md">
                  <section><p className="text-label uppercase text-text-secondary">Stage context</p><p className="text-body">{b.content.stageContext}</p></section>
                  <section>
                    <p className="text-label uppercase text-text-secondary mb-xs">Anchor stories</p>
                    {b.content.anchorStories.map((s, i) => (
                      <div key={i} className="p-md border border-border-subtle rounded-md mb-sm">
                        <p className="text-subheading">{s.name}</p>
                        <p className="text-caption text-text-tertiary">source: {s.sourceRoleSlug}</p>
                        <p className="text-body mt-sm"><strong>S:</strong> {s.star.situation}</p>
                        <p className="text-body"><strong>T:</strong> {s.star.task}</p>
                        <p className="text-body"><strong>A:</strong> {s.star.action}</p>
                        <p className="text-body"><strong>R:</strong> {s.star.result}</p>
                      </div>
                    ))}
                  </section>
                  <section>
                    <p className="text-label uppercase text-text-secondary mb-xs">Question clusters</p>
                    {b.content.questionClusters.map((c, i) => (
                      <details key={i} className="border border-border-subtle rounded-md p-md mb-sm">
                        <summary className="text-subheading cursor-pointer">{c.name}</summary>
                        <ul className="mt-sm flex flex-col gap-sm">
                          {c.questions.map((q, j) => (
                            <li key={j}><p className="text-body"><strong>Q:</strong> {q.q}</p><p className="text-body"><strong>A:</strong> {q.howToAnswer}</p></li>
                          ))}
                        </ul>
                      </details>
                    ))}
                  </section>
                  {b.content.toughQuestions ? <section><p className="text-label uppercase text-text-secondary">Tough questions</p><p className="text-body">{b.content.toughQuestions}</p></section> : null}
                  {b.content.questionsToAsk.length > 0 ? (
                    <section>
                      <p className="text-label uppercase text-text-secondary mb-xs">Questions to ask</p>
                      <table className="w-full text-small">
                        <tbody>{b.content.questionsToAsk.map((q, i) => <tr key={i} className="border-t border-border-subtle"><td className="p-xs">{q.question}</td><td className="p-xs text-text-secondary">{q.listenFor}</td></tr>)}</tbody>
                      </table>
                    </section>
                  ) : null}
                  {b.content.logistics ? <section><p className="text-label uppercase text-text-secondary">Logistics</p><p className="text-body">{b.content.logistics}</p></section> : null}
                </div>
              ) : null}
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
