import { SectionHeader } from "@/components/sections/section-header";

type Linked = { id: number; name: string; categoryName: string; proficiency: "familiar" | "proficient" | "expert" };

export function LinkedSkillsSection({ skills }: { skills: Linked[] }) {
  return (
    <div className="flex flex-col gap-md">
      <SectionHeader title="Linked skills" />
      {skills.length === 0 ? (
        <p className="text-small text-text-secondary">
          No skills linked. Skills are connected via the Skills page.
        </p>
      ) : (
        <ul className="flex flex-col gap-xs">
          {skills.map((s) => (
            <li key={s.id} className="flex items-center justify-between p-sm border-b border-border-subtle text-body">
              <span>
                {s.name} <span className="text-text-secondary text-small">— {s.categoryName}</span>
              </span>
              <span className="text-label uppercase text-text-secondary">{s.proficiency}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
