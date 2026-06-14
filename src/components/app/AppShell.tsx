import type { ReactNode } from "react";
import { SideNav, useSidebarCollapsed } from "@/components/app/SideNav";

export function AppShell({
  children,
  rightPanel,
}: {
  children: ReactNode;
  rightPanel?: ReactNode;
}) {
  const { collapsed, toggle } = useSidebarCollapsed();
  const sidebarWidth = collapsed ? "64px" : "220px";
  return (
    <div className="min-h-screen w-full bg-background md:flex">
      <div
        className="hidden shrink-0 md:block md:sticky md:top-0 md:h-screen transition-[width] duration-[250ms] ease-out"
        style={{ width: sidebarWidth }}
      >
        <SideNav
          className="h-full w-full"
          collapsed={collapsed}
          onToggle={toggle}
        />
      </div>
      <div className="app-shell-inner min-w-0 flex-1">{children}</div>
      <aside className="hidden w-[320px] shrink-0 overflow-y-auto border-l border-border bg-card lg:sticky lg:top-0 lg:block lg:h-screen">
        {rightPanel}
      </aside>
    </div>
  );
}