import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Heart, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createPet } from "@/lib/pets.functions";
import { useActivePet } from "@/stores/active-pet";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const create = useServerFn(createPet);
  const setActive = useActivePet((s) => s.setActivePetId);

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [breed, setBreed] = useState("");
  const [birth, setBirth] = useState("");
  const [sex, setSex] = useState("");
  const [notes, setNotes] = useState("");

  const mut = useMutation({
    mutationFn: () =>
      create({
        data: {
          name: name.trim(),
          species,
          breed: breed.trim() || null,
          birth_date: birth || null,
          sex: sex || null,
          notes: notes.trim() || null,
        },
      }),
    onSuccess: (pet) => {
      setActive(pet.id);
      qc.invalidateQueries({ queryKey: ["pets"] });
      toast.success(`${pet.name} added`);
      navigate({ to: "/home", replace: true });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save"),
  });

  return (
    <div className="app-shell">
      <div className="flex flex-1 flex-col px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {step === 1 ? <PawPrint className="h-6 w-6" /> : <Heart className="h-6 w-6 fill-primary/30" />}
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Step {step} of 2</p>
            <h1 className="text-xl font-bold">{step === 1 ? "Meet your pet" : "A few more details"}</h1>
          </div>
        </div>

        {step === 1 ? (
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Luna" autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="species">Species</Label>
              <Select value={species} onValueChange={setSpecies}>
                <SelectTrigger id="species"><SelectValue /></SelectTrigger>
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
            <div className="grid gap-1.5">
              <Label htmlFor="breed">Breed (optional)</Label>
              <Input id="breed" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Border collie" />
            </div>
            <Button
              className="mt-4"
              disabled={!name.trim()}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="birth">Birthday (optional)</Label>
              <Input id="birth" type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sex">Sex (optional)</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger id="sex"><SelectValue placeholder="Not specified" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="notes">Anything important to remember?</Label>
              <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, fears, quirks…" />
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="ghost" onClick={() => mut.mutate()} disabled={mut.isPending} className="flex-1">
                Skip
              </Button>
              <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="flex-1">
                {mut.isPending ? "Saving…" : "Finish"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}