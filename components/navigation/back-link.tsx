import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href as any}
      className="inline-flex items-center gap-xs text-small text-text-secondary hover:text-text"
    >
      ← {label}
    </Link>
  );
}
