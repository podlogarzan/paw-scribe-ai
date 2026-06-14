import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, Settings, User } from "lucide-react";
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

export function AppHeader({ title: _title }: { title?: string }) {
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
    <header className="sticky top-0 z-20 border-b border-[#F0F0F0] bg-white/85 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full transition-transform hover:scale-[1.03]" aria-label="Switch pet">
              <PetAvatar
                name={activePet?.name ?? "Pet"}
                url={activePet?.avatar_url}
                species={activePet?.species}
                size={40}
              />
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
                <PetAvatar name={p.name} url={p.avatar_url} species={p.species} size={24} />
                <span className={p.id === activePet?.id ? "font-semibold" : ""}>{p.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
              <User className="h-4 w-4" /> Manage pets
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <h1 className="truncate text-center text-base font-semibold text-foreground">
          {activePet?.name ?? "Vetyco"}
        </h1>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu" className="text-[color:var(--warm)]">
              <Settings className="h-5 w-5" strokeWidth={1.75} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
              <User className="h-4 w-4" /> Pet profile
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