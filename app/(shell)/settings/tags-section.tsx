"use client";
import { useState, useTransition } from "react";
import { createTag, deleteTag } from "@/server/actions/tag";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ui/confirm-modal";

type Tag = { id: number; slug: string; label: string; usage: number };

export function TagsSection({ tags }: { tags: Tag[] }) {
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState<Tag | null>(null);
  const [slug, setSlug] = useState("");
  const [label, setLabel] = useState("");
  const [pending, start] = useTransition();

  return (
    <Card>
      <CardHeader title="Tags" actions={!adding ? <Button onClick={() => setAdding(true)}>Add tag</Button> : null} />
      <CardBody className="flex flex-col gap-sm">
        {tags.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-sm border-b border-border-subtle">
            <div className="flex items-center gap-md">
              <span className="font-mono text-small">{t.slug}</span>
              <span className="text-body">{t.label}</span>
              <span className="text-caption text-text-tertiary">used in {t.usage}</span>
            </div>
            <Button variant="ghost" onClick={() => setConfirming(t)}>Delete</Button>
          </div>
        ))}
        {adding ? (
          <div className="flex items-center gap-sm pt-md">
            <Input placeholder="slug (kebab)" value={slug} onChange={(e) => setSlug(e.target.value)} className="font-mono" />
            <Input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
            <Button
              disabled={pending || !slug || !label}
              onClick={() =>
                start(async () => {
                  const fd = new FormData();
                  fd.set("slug", slug); fd.set("label", label);
                  const r = await createTag(fd);
                  if (r.ok) { setSlug(""); setLabel(""); setAdding(false); }
                })
              }
            >
              Create
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        ) : null}
        {confirming ? (
          <ConfirmModal
            open
            title={`Delete tag "${confirming.slug}"?`}
            description={`This will remove the tag from ${confirming.usage} item(s).`}
            confirmWord={confirming.slug}
            onConfirm={() => start(async () => { await deleteTag(confirming.id); setConfirming(null); })}
            onClose={() => setConfirming(null)}
          />
        ) : null}
      </CardBody>
    </Card>
  );
}
