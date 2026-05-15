"use client";
import { useState, useTransition } from "react";
import { createSkill, updateSkill, deleteSkill } from "@/server/actions/skill";
import { setSkillApplications } from "@/server/actions/skill-application";
import { deleteSkillCategory } from "@/server/actions/skill-category";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Skill = {
  id: number;
  name: string;
  proficiency: "familiar" | "proficient" | "expert";
  notes: string | null;
  order: number;
  roleIds: number[];
};

type Role = { id: number; company: string; title: string };

export function HardSkillsCategorySection({
  category,
  skills,
  availableRoles: _availableRoles,
}: {
  category: { id: number; name: string; order: number };
  skills: Skill[];
  availableRoles: Role[];
}) {
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  function SkillRow({ skill }: { skill: Skill | null }) {
    const [name, setName] = useState(skill?.name ?? "");
    const [proficiency, setProficiency] = useState<Skill["proficiency"]>(skill?.proficiency ?? "proficient");
    const [notes, setNotes] = useState(skill?.notes ?? "");
    const [order, setOrder] = useState(String(skill?.order ?? skills.length));
    const [roleIds] = useState<number[]>(skill?.roleIds ?? []);
    return (
      <div className="grid grid-cols-[1fr_120px_1fr_60px_auto] gap-sm items-center px-md py-sm">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Skill name" />
        <Select value={proficiency} onChange={(e) => setProficiency(e.target.value as Skill["proficiency"])}>
          <option value="familiar">Familiar</option>
          <option value="proficient">Proficient</option>
          <option value="expert">Expert</option>
        </Select>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
        <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
        <div className="flex gap-xs">
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                const fd = new FormData();
                fd.set("name", name); fd.set("proficiency", proficiency); fd.set("notes", notes); fd.set("order", order);
                const r = skill ? await updateSkill(skill.id, fd) : await createSkill(category.id, fd);
                if (r.ok && !skill && r.data != null && "id" in r.data) await setSkillApplications(r.data.id, roleIds);
                if (skill) await setSkillApplications(skill.id, roleIds);
                setEditingId(null); setAdding(false);
              })
            }
          >
            Save
          </Button>
          {skill ? (
            <Button variant="ghost" onClick={() => start(async () => { await deleteSkill(skill.id); })}>×</Button>
          ) : (
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-sm">
            {category.name}
            <span className="text-small text-text-tertiary">order {category.order}</span>
          </span>
        }
        actions={
          <>
            <Button onClick={() => setAdding(true)}>Add skill</Button>
            <Button
              variant="ghost"
              onClick={() => start(async () => { if (confirm(`Delete category "${category.name}"?`)) await deleteSkillCategory(category.id); })}
            >
              Delete category
            </Button>
          </>
        }
      />
      <div className="px-md py-sm border-b border-border-subtle grid grid-cols-[1fr_120px_1fr_60px_auto] gap-sm text-label uppercase text-text-secondary">
        <span>Name</span><span>Proficiency</span><span>Notes</span><span>Order</span><span>Actions</span>
      </div>
      {skills.map((s) =>
        editingId === s.id ? (
          <SkillRow key={s.id} skill={s} />
        ) : (
          <div
            key={s.id}
            className="grid grid-cols-[1fr_120px_1fr_60px_auto] gap-sm items-center px-md py-sm hover:bg-surface-raised cursor-pointer"
            onClick={() => setEditingId(s.id)}
          >
            <span className="text-body">{s.name}</span>
            <span className="text-label uppercase text-text-secondary">{s.proficiency}</span>
            <span className="text-small text-text-secondary truncate">{s.notes ?? "—"}</span>
            <span className="text-small">{s.order}</span>
            <span />
          </div>
        ),
      )}
      {adding ? <SkillRow skill={null} /> : null}
    </Card>
  );
}
