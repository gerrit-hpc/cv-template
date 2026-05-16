"use client";
import { useState, useTransition } from "react";
import { createSoftSkill, updateSoftSkill, deleteSoftSkill } from "@/server/actions/soft-skill";
import { SectionHeader } from "@/components/sections/section-header";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormNumber } from "@/components/forms/form-number";
import { TagSelector } from "@/components/forms/tag-selector";

type SoftSkill = {
  id: number;
  name: string;
  whereDemonstrated: string;
  whatHappened: string;
  order: number;
  tags: string[];
};
type AvailableTag = { slug: string; label: string };

export function SoftSkillsSection({ items, availableTags }: { items: SoftSkill[]; availableTags: AvailableTag[] }) {
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  function Form({ skill, onClose }: { skill: SoftSkill | null; onClose: () => void }) {
    return (
      <form
        action={(fd) => start(async () => {
          const r = skill ? await updateSoftSkill(skill.id, fd) : await createSoftSkill(fd);
          if (r.ok) onClose();
        })}
        className="flex flex-col gap-md"
      >
        <FormField label="Name" name="name" defaultValue={skill?.name ?? ""} />
        <FormTextarea label="Where demonstrated" name="whereDemonstrated" rows={3} defaultValue={skill?.whereDemonstrated ?? ""} />
        <FormTextarea label="What happened" name="whatHappened" rows={3} defaultValue={skill?.whatHappened ?? ""} />
        <FormNumber label="Order" name="order" defaultValue={skill?.order ?? items.length} />
        <div>
          <p className="text-label uppercase text-text-secondary mb-xs">Tags</p>
          <TagSelector name="tagSlugs" available={availableTags} selected={skill?.tags ?? []} />
        </div>
        <div className="flex justify-end gap-sm">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>{skill ? "Save" : "Add"}</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      <SectionHeader title="Soft skills" actions={<Button onClick={() => setAdding(true)}>Add soft skill</Button>} />
      {items.map((s) => (
        <Card key={s.id}>
          <CardBody>
            {editingId === s.id ? (
              <Form skill={s} onClose={() => setEditingId(null)} />
            ) : (
              <div className="flex flex-col gap-sm">
                <div className="flex items-start justify-between">
                  <p className="text-subheading">{s.name}</p>
                  <div className="flex gap-sm">
                    <Button variant="ghost" onClick={() => setEditingId(s.id)}>Edit</Button>
                    <Button variant="ghost" onClick={() => start(async () => { if (confirm(`Delete soft skill "${s.name}"?`)) await deleteSoftSkill(s.id); })}>Delete</Button>
                  </div>
                </div>
                <p className="text-body"><strong>Where:</strong> {s.whereDemonstrated}</p>
                <p className="text-body"><strong>What:</strong> {s.whatHappened}</p>
              </div>
            )}
          </CardBody>
        </Card>
      ))}
      {adding ? (
        <Card>
          <CardBody>
            <Form skill={null} onClose={() => setAdding(false)} />
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
