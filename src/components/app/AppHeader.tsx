import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, FileText, LogOut, Settings2, User } from "lucide-react";
import { listPets } from "@/lib/pets.functions";
import { useActivePet } from "@/stores/active-pet";
import { PetAvatar } from "@/components/app/PetAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function AppHeader({ title }: { title?: string }) {
  const fetchPets = useServerFn(listPets);
  const { data: pets } = useQuery({ queryKey: ["pets"], queryFn: () => fetchPets() });
  const { activePetId, setActivePetId } = useActivePet();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const activePet = pets?.find((p) => p.id === activePetId) ?? pets?.[0] ?? null;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full pr-2 transition-colors hover:bg-accent">
              <PetAvatar name={activePet?.name ?? "Pet"} url={activePet?.avatar_url} size={36} />
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Active pet
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                  {activePet?.name ?? "Choose pet"}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Your pets</DropdownMenuLabel>
            {(pets ?? []).map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => setActivePetId(p.id)}
                className="gap-2"
              >
                <PetAvatar name={p.name} url={p.avatar_url} size={24} />
                <span className={p.id === activePet?.id ? "font-semibold" : ""}>{p.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
              <User className="h-4 w-4" /> Manage pets
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {title ? (
          <h1 className="text-sm font-semibold text-muted-foreground">{title}</h1>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Settings2 className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/profile"><User className="h-4 w-4" /> Pet profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/chat"><FileText className="h-4 w-4" /> Chat history</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}