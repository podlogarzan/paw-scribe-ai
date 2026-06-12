import type { EntryType } from "@/lib/entries.functions";
import { cn } from "@/lib/utils";

const colorByType: Record<EntryType, string> = {
  appointment: "bg-[color:var(--appointment)]",
  vaccination: "bg-[color:var(--vaccination)]",
  health_issue: "bg-[color:var(--health)]",
  note: "bg-[color:var(--note)]",
  ai_log: "bg-[color:var(--ai)]",
};

export const ENTRY_LABEL: Record<EntryType, string> = {
  appointment: "Appointment",
  vaccination: "Vaccination",
  health_issue: "Health issue",
  note: "Note",
  ai_log: "Logged by AI",
};

export function EntryDot({ type, className }: { type: EntryType; className?: string }) {
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", colorByType[type], className)} />;
}

export function EntryBadge({ type }: { type: EntryType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground",
      )}
    >
      <EntryDot type={type} /> {ENTRY_LABEL[type]}
    </span>
  );
}