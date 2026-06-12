import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PetAvatar } from "@/components/app/PetAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createPet, listPets } from "@/lib/pets.functions";
import { useActivePet } from "@/stores/active-pet";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchPets = useServerFn(listPets);
  const create = useServerFn(createPet);
  const { activePetId, setActivePetId } = useActivePet();

  const petsQ = useQuery({ queryKey: ["pets"], queryFn: () => fetchPets() });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");

  const mut = useMutation({
    mutationFn: () => create({ data: { name: name.trim(), species } }),
    onSuccess: (pet) => {
      setActivePetId(pet.id);
      qc.invalidateQueries({ queryKey: ["pets"] });
      toast.success(`${pet.name} added`);
      setOpen(false);
      setName("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not add"),
  });

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
                onClick={() => setActivePetId(p.id)}
                className={`soft-card flex w-full items-center gap-3 p-3 text-left ${
                  p.id === activePetId ? "ring-2 ring-primary" : ""
                }`}
              >
                <PetAvatar name={p.name} url={p.avatar_url} size={48} />
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add a pet</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="pn">Name</Label>
              <Input id="pn" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ps">Species</Label>
              <Select value={species} onValueChange={setSpecies}>
                <SelectTrigger id="ps"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">Dog</SelectItem>
                  <SelectItem value="cat">Cat</SelectItem>
                  <SelectItem value="rabbit">Rabbit</SelectItem>
                  <SelectItem value="bird">Bird</SelectItem>
                  <SelectItem value="reptile">Reptile</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => mut.mutate()} disabled={!name.trim() || mut.isPending}>
              {mut.isPending ? "Saving…" : "Add pet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}