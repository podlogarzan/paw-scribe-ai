import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createPet } from "@/lib/pets.functions";
import { useActivePet } from "@/stores/active-pet";
import { SPECIES, EXTRA_SPECIES, speciesLabel } from "@/lib/species";
import { supabase } from "@/integrations/supabase/client";
import { uploadPetAvatar } from "@/lib/pets.functions";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const create = useServerFn(createPet);
  const uploadAvatar = useServerFn(uploadPetAvatar);
  const setActive = useActivePet((s) => s.setActivePetId);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [otherQuery, setOtherQuery] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [breed, setBreed] = useState("");
  const [birth, setBirth] = useState("");
  const [sex, setSex] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const otherMatches = useMemo(() => {
    const q = otherQuery.trim().toLowerCase();
    if (!q) return EXTRA_SPECIES.slice(0, 12);
    return EXTRA_SPECIES.filter((s) => s.label.toLowerCase().includes(q)).slice(0, 12);
  }, [otherQuery]);

  const breedsQuery = useQuery({
    queryKey: ["breeds", species],
    enabled: !!species,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("breeds")
        .select("breed_name,is_mixed_unknown,display_order")
        .eq("species", species)
        .order("display_order", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const breedList = useMemo(() => {
    const rows = breedsQuery.data ?? [];
    if (rows.length === 0) {
      return [{ breed_name: "Mixed breed / Don't know", is_mixed_unknown: true, display_order: 9999 }];
    }
    const real = rows.filter((r) => !r.is_mixed_unknown);
    const fallback = rows.filter((r) => r.is_mixed_unknown);
    return [...real, ...fallback];
  }, [breedsQuery.data]);

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
      navigate({ to: "/chat", replace: true });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save"),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-1 flex-col px-6 py-10">
        {/* Progress dots */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={cn(
                "h-2 rounded-full transition-all",
                n === step ? "w-8 bg-primary" : "w-2 bg-border",
              )}
            />
          ))}
        </div>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">
          {step === 1 ? "What's your pet?" : step === 2 ? "Tell us about them" : "A few more details"}
        </h1>

        {step === 1 ? (
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-3">
              {SPECIES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    setSpecies(s.value);
                    setShowOther(false);
                  }}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border bg-card p-2 text-xs font-medium transition-all hover:scale-[1.02]",
                    species === s.value
                      ? "border-primary bg-[color:var(--ai-soft)] ring-2 ring-primary"
                      : "border-border",
                  )}
                >
                  <span className="text-3xl">{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowOther((v) => !v)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border bg-card p-2 text-xs font-medium transition-all hover:scale-[1.02]",
                  showOther ? "border-primary ring-2 ring-primary" : "border-border",
                )}
              >
                <span className="text-3xl">❓</span>
                <span>Other</span>
              </button>
            </div>
            {showOther && (
              <div className="grid gap-2 rounded-2xl border border-border bg-card p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    value={otherQuery}
                    onChange={(e) => setOtherQuery(e.target.value)}
                    placeholder="Search species…"
                    className="rounded-2xl pl-9"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {otherMatches.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSpecies(s.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border bg-background p-2 text-[11px] font-medium",
                        species === s.value
                          ? "border-primary bg-[color:var(--ai-soft)]"
                          : "border-border",
                      )}
                    >
                      <span className="text-xl">{s.emoji}</span>
                      <span className="truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Button
              size="lg"
              className="mt-2 h-12 w-full rounded-full text-base"
              disabled={!species}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        ) : step === 2 ? (
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Luna" autoFocus className="h-12 rounded-2xl" />
            </div>
            <div className="grid gap-1.5">
              <Label>Breed</Label>
              {breedsQuery.isLoading ? (
                <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">Loading breeds…</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {breedList.map((b) => {
                    const selected = breed === b.breed_name;
                    return (
                      <button
                        key={b.breed_name}
                        type="button"
                        onClick={() => setBreed(b.breed_name)}
                        className={cn(
                          "rounded-2xl border bg-card px-3 py-3 text-sm font-medium transition-all hover:scale-[1.01] text-left",
                          b.is_mixed_unknown && "border-dashed",
                          selected
                            ? "border-primary bg-[color:var(--ai-soft)] ring-2 ring-primary"
                            : "border-border",
                        )}
                      >
                        {b.breed_name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <Button
              size="lg"
              className="mt-2 h-12 w-full rounded-full text-base"
              disabled={!name.trim()}
              onClick={() => {
                if (!breed) {
                  const fallback = breedList.find((b) => b.is_mixed_unknown) ?? breedList[0];
                  if (fallback) setBreed(fallback.breed_name);
                }
                setStep(3);
              }}
            >
              Continue
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="birth">Birthday (optional)</Label>
              <Input id="birth" type="date" value={birth} onChange={(e) => setBirth(e.target.value)} className="h-12 rounded-2xl" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sex">Sex (optional)</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger id="sex" className="h-12 rounded-2xl"><SelectValue placeholder="Not specified" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="notes">Anything important to remember?</Label>
              <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, fears, quirks…" className="rounded-2xl" />
            </div>
            <div className="mt-2 flex gap-2">
              <Button variant="ghost" onClick={() => mut.mutate()} disabled={mut.isPending} className="h-12 flex-1 rounded-full">
                Skip
              </Button>
              <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="h-12 flex-1 rounded-full text-base">
                {mut.isPending ? "Saving…" : "Finish"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}