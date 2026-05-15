"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const PRIMARY = [
  { href: "/profile", label: "Profile" },
  { href: "/experience", label: "Experience" },
  { href: "/skills", label: "Skills" },
  { href: "/education", label: "Education" },
  { href: "/values", label: "Values" },
  { href: "/applications", label: "Applications" },
] as const;

export function LeftRail() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col h-full w-[220px] shrink-0 bg-surface border-r border-border">
      <div className="px-lg py-xl">
        <p className="font-mono text-body text-text">
          KB <span className="text-text-secondary">Manager</span>
        </p>
      </div>
      <ul className="flex flex-col gap-xs px-md">
        {PRIMARY.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href as any}
                className={cn(
                  "flex items-center h-[34px] px-sm rounded-sm text-small",
                  active ? "bg-surface-raised text-text border-l-2 border-accent" : "text-text-secondary hover:bg-surface-raised hover:text-text",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-lg mx-md border-t border-border-subtle" />
      <ul className="flex flex-col gap-xs px-md mt-md">
        <li>
          <Link
            href={"/settings" as any}
            className={cn(
              "flex items-center h-[34px] px-sm rounded-sm text-small",
              pathname.startsWith("/settings") ? "bg-surface-raised text-text" : "text-text-secondary hover:bg-surface-raised hover:text-text",
            )}
          >
            Settings
          </Link>
        </li>
      </ul>
      <div className="mt-auto px-lg py-md">
        <p className="text-caption text-text-tertiary">v0.1.0</p>
      </div>
    </nav>
  );
}
