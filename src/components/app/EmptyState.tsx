import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      {icon ? <div className="mb-4 text-4xl">{icon}</div> : null}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {body ? <p className="mt-1 max-w-xs text-sm text-muted-foreground">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}