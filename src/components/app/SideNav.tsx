import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Images, LogOut, MessageCircleHeart, PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";
import { listPets } from "@/lib/pets.functions";
import { useActivePet } from "@/stores/active-pet";
import { PetAvatar } from "@/components/app/PetAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

const items = [
  { to: "/home", icon: CalendarDays, label: "Calendar" },
  { to: "/chat", icon: MessageCircleHeart, label: "Chat" },
  { to: "/gallery", icon: Images, label: "Gallery" },
] as const;

export function SideNav({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchPets = useServerFn(listPets);
  const { data: pets } = useQuery({ queryKey: ["pets"], queryFn: () => fetchPets() });
  const { activePetId } = useActivePet();
  const activePet = pets?.find((p) => p.id === activePetId) ?? pets?.[0] ?? null;

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <aside className={cn("flex flex-col border-r border-border bg-card", className)}>
      <Link
        to="/home"
        className="flex items-center gap-2 px-5 py-5"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
          <PawPrint className="h-4 w-4" />
        </div>
        <span className="text-base font-bold tracking-tight">PetVet</span>
      </Link>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {items.map(({ to, icon: Icon, label }) => {
            const active = pathname === to || pathname.startsWith(`${to}/`);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/80 hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {activePet ? (
        <div className="m-3 hidden rounded-xl border border-border bg-background p-2 lg:block">
          <Link to="/profile" className="flex min-w-0 items-center gap-2">
            <PetAvatar name={activePet.name} url={activePet.avatar_url} size={36} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{activePet.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {activePet.species}
                {activePet.breed ? ` · ${activePet.breed}` : ""}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleSignOut();
              }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </Link>
        </div>
      ) : null}
    </aside>
  );
}