import { cn } from "@/lib/cn";

export type ApplicationStatus = "drafting" | "applied" | "interviewing" | "offer" | "closed";

const STATUS_STYLES: Record<ApplicationStatus, { dot: string; text: string; bg: string; label: string }> = {
  drafting: { dot: "bg-status-draft", text: "text-status-draft", bg: "bg-border", label: "Drafting" },
  applied: { dot: "bg-status-applied", text: "text-status-applied", bg: "bg-accent-muted", label: "Applied" },
  interviewing: {
    dot: "bg-status-interviewing",
    text: "text-status-interviewing",
    bg: "bg-status-interviewing-muted",
    label: "Interviewing",
  },
  offer: { dot: "bg-status-offer", text: "text-status-offer", bg: "bg-success-muted", label: "Offer" },
  closed: { dot: "bg-status-closed", text: "text-status-closed", bg: "bg-danger-muted", label: "Closed" },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-xs px-md rounded-full text-label",
        s.bg,
        s.text,
      )}
    >
      <span
        aria-label={`${status} status indicator`}
        className={cn("inline-block h-2 w-2 rounded-full", s.dot)}
      />
      {s.label}
    </span>
  );
}
