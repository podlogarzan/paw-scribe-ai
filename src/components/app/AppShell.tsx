import type { ReactNode } from "react";
import { SideNav } from "@/components/app/SideNav";

export function AppShell({
  children,
  rightPanel,
}: {
  children: ReactNode;
  rightPanel?: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background md:grid md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)_320px]">
      <SideNav className="hidden md:sticky md:top-0 md:flex md:h-screen" />
      <div className="app-shell-inner">{children}</div>
      <aside className="hidden overflow-y-auto border-l border-border bg-card lg:sticky lg:top-0 lg:block lg:h-screen">
        {rightPanel}
      </aside>
    </div>
  );
}