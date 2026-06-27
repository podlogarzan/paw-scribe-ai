import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Images, LogOut, MessageCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { listPets } from "@/lib/pets.functions";
import { useActivePet } from "@/stores/active-pet";
import { PetAvatar } from "@/components/app/PetAvatar";
import { LogoMark } from "@/components/app/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const items = [
  { to: "/home", icon: CalendarDays, label: "Calendar" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/gallery", icon: Images, label: "Gallery" },
] as const;

export function SideNav({
  className,
  collapsed,
  onToggle,
}: {
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchPets = useServerFn(listPets);
  const { data: pets } = useQuery({ queryKey: ["pets"], queryFn: () => fetchPets() });
  const { activePetId, setActivePetId } = useActivePet();
  const activePet = pets?.find((p) => p.id === activePetId) ?? pets?.[0] ?? null;

  function handleSelectPet(id: string) {
    setActivePetId(id);
    qc.invalidateQueries({ queryKey: ["entries"] });
    qc.invalidateQueries({ queryKey: ["gallery"] });
    qc.invalidateQueries({ queryKey: ["conversations"] });
  }

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-[color:var(--border)] bg-[#FAFAF8] transition-[width] duration-[250ms] ease-out",
        className,
      )}
    >
      <Link to="/home" className="flex items-center gap-2 px-4 py-5">
        <LogoMark size={36} />
        {!collapsed && (
          <span className="text-base font-semibold tracking-tight">vetyco</span>
        )}
      </Link>

      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-7 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-[var(--shadow-soft)] transition-transform hover:scale-105 lg:flex"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      )}

      <nav className={cn("flex-1", collapsed ? "px-2" : "px-3")}>
        <ul className="space-y-1">
          {items.map(({ to, icon: Icon, label }) => {
            const active = pathname === to || pathname.startsWith(`${to}/`);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                      : "text-foreground/75 hover:bg-accent hover:text-foreground",
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {activePet ? (
        <div className={cn("m-3 rounded-2xl border border-border bg-card p-2", collapsed && "px-1")}>
          <div className={cn("flex min-w-0 items-center gap-2", collapsed && "justify-center")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    collapsed && "justify-center",
                  )}
                  aria-label="Switch pet"
                >
                  <PetAvatar
                    name={activePet.name}
                    url={activePet.avatar_url}
                    species={activePet.species}
                    size={36}
                  />
                  {!collapsed && (
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{activePet.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {activePet.species}
                        {activePet.breed ? ` · ${activePet.breed}` : ""}
                      </div>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-64 p-1">
                {(pets ?? []).map((p) => {
                  const isActive = p.id === activePet.id;
                  return (
                    <DropdownMenuItem
                      key={p.id}
                      onSelect={() => handleSelectPet(p.id)}
                      className="gap-2 p-2"
                    >
                      <PetAvatar name={p.name} url={p.avatar_url} species={p.species} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{p.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {p.species}
                          {p.breed ? ` · ${p.breed}` : ""}
                        </div>
                      </div>
                      {isActive && <Check className="h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => navigate({ to: "/onboarding" })}
                  className="gap-2 p-2"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-accent">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Add new pet</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {!collapsed && (
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-md p-1.5 text-[color:var(--warm)] hover:bg-accent"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ) : null}
    </aside>
  );
}

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const v = localStorage.getItem("vetyco_sidebar_collapsed");
    if (v === "1") setCollapsed(true);
  }, []);
  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("vetyco_sidebar_collapsed", next ? "1" : "0");
      } catch {
        /* noop */
      }
      return next;
    });
  }
  return { collapsed, toggle };
}