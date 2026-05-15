"use client";
import { useState, useTransition } from "react";
import { createAchievement, updateAchievement, deleteAchievement } from "@/server/actions/experience";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormNumber } from "@/components/forms/form-number";
import { TagSelector } from "@/components/forms/tag-selector";

type Achievement = {
  id: number;
  title: string;
  result: string;
  context: string;
  action: string;
  order: number;
  tags: { tag: { slug: string; label: string } }[];
};

type AvailableTag = { slug: string; label: string };

export function AchievementsSection({
  roleId,
  items,
  availableTags,
}: {
  roleId: number;
  items: Achievement[];
  availableTags: AvailableTag[];
}) {
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  function AchievementForm({ achievement, onClose }: { achievement: Achievement | null; onClose: () => void }) {
    return (
      <form
        action={(fd) =>
          start(async () => {
            if (achievement) {
              const r = await updateAchievement(achievement.id, fd);
              if (r.ok) onClose();
            } else {
              const r = await createAchievement(roleId, fd);
              if (r.ok) onClose();
            }
          })
        }
        className="flex flex-col gap-md"
      >
        <FormField label="Title" name="title" defaultValue={achievement?.title ?? ""} />
        <FormTextarea label="Context" name="context" rows={3} defaultValue={achievement?.context ?? ""} />
        <FormTextarea label="Action" name="action" rows={3} defaultValue={achievement?.action ?? ""} />
        <FormTextarea label="Result" name="result" rows={3} defaultValue={achievement?.result ?? ""} />
        <FormNumber label="Order" name="order" defaultValue={achievement?.order ?? items.length} />
        <div>
          <p className="text-label uppercase text-text-secondary mb-xs">Tags</p>
          <TagSelector
            name="tagSlugs"
            available={availableTags}
            selected={achievement?.tags.map((t) => t.tag.slug) ?? []}
          />
        </div>
        <div className="flex justify-end gap-sm">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>{achievement ? "Save" : "Add"}</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      <SectionHeader title="Achievements" actions={<Button onClick={() => setAdding(true)}>Add achievement</Button>} />
      {items.map((a) => (
        <Card key={a.id}>
          <CardBody className="flex flex-col gap-sm">
            {editingId === a.id ? (
              <AchievementForm achievement={a} onClose={() => setEditingId(null)} />
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-subheading">{a.title}</p>
                    <p className="text-small text-text-tertiary">order {a.order}</p>
                  </div>
                  <div className="flex gap-sm">
                    <Button variant="ghost" onClick={() => setEditingId(a.id)}>Edit</Button>
                    <Button
                      variant="ghost"
                      onClick={() => start(async () => { await deleteAchievement(a.id); })}
                      disabled={pending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <p className="text-body"><strong>Result:</strong> {a.result}</p>
                <p className="text-body"><strong>Context:</strong> {a.context}</p>
                <p className="text-body"><strong>Action:</strong> {a.action}</p>
              </>
            )}
          </CardBody>
        </Card>
      ))}
      {adding ? (
        <Card>
          <CardBody>
            <AchievementForm achievement={null} onClose={() => setAdding(false)} />
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
