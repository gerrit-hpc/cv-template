"use client";
import { useState, useTransition } from "react";
import { createSkillCategory } from "@/server/actions/skill-category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewCategoryButton({ nextOrder }: { nextOrder: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  if (!open) return <Button onClick={() => setOpen(true)}>Add category</Button>;
  return (
    <div className="flex items-center gap-sm">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
      <Button
        disabled={pending || !name}
        onClick={() =>
          start(async () => {
            const fd = new FormData();
            fd.set("name", name);
            fd.set("order", String(nextOrder));
            await createSkillCategory(fd);
            setName("");
            setOpen(false);
          })
        }
      >
        Create
      </Button>
      <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    </div>
  );
}
