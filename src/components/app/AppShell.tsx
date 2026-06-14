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
    <div
      className="min-h-screen w-full bg-background md:grid lg:grid-cols-[var(--sb)_minmax(0,1fr)_320px]"
      style={{
        // @ts-expect-error css var
        "--sb": sidebarWidth,
        gridTemplateColumns: undefined,
      }}
    >
      <div
        className="hidden md:block"
        style={{ width: sidebarWidth }}
      >
        <SideNav
          className="sticky top-0 hidden h-screen md:flex"
          style={{ width: sidebarWidth }}
          collapsed={collapsed}
          onToggle={toggle}
        />
      </div>
      <div className="app-shell-inner">{children}</div>
      <aside className="hidden overflow-y-auto border-l border-border bg-card lg:sticky lg:top-0 lg:block lg:h-screen">
        {rightPanel}
      </aside>
    </div>
  );
}