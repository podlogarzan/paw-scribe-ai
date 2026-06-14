import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Plus } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PetAvatar } from "@/components/app/PetAvatar";
import { AddPetDialog } from "@/components/app/AddPetDialog";
import { Button } from "@/components/ui/button";
import { listPets } from "@/lib/pets.functions";
import { useActivePet } from "@/stores/active-pet";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const fetchPets = useServerFn(listPets);
  const { activePetId, setActivePetId } = useActivePet();

  const petsQ = useQuery({ queryKey: ["pets"], queryFn: () => fetchPets() });
  const [open, setOpen] = useState(false);

  return (
    <AppShell>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/home" })}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-sm font-semibold">Your pets</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </header>
      <main className="flex-1 px-4 py-4">
        <ul className="grid gap-2">
          {(petsQ.data ?? []).map((p) => (
            <li key={p.id}>
              <button
                onClick={() => { setActivePetId(p.id); navigate({ to: "/pet/$petId", params: { petId: p.id } }); }}
                className={`soft-card flex w-full items-center gap-3 p-3 text-left ${
                  p.id === activePetId ? "ring-2 ring-primary" : ""
                }`}
              >
              <PetAvatar name={p.name} url={p.avatar_url} species={p.species} size={48} />
                <div className="grid">
                  <span className="text-base font-semibold leading-tight">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.species}
                    {p.breed ? ` · ${p.breed}` : ""}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </main>

      <AddPetDialog open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}