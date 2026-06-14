import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Camera, Heart, PawPrint } from "lucide-react";
import { differenceInYears, parseISO } from "date-fns";
import { toast } from "sonner";
import { listPets, updatePet, uploadPetAvatar } from "@/lib/pets.functions";
import { speciesEmoji } from "@/lib/species";
import { BottomTabBar } from "@/components/app/BottomTabBar";

export const Route = createFileRoute("/_authenticated/pet/$petId")({
  component: PetDetailPage,
});

function arrayBufferToBase64(buf: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function PetDetailPage() {
  const { petId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchPets = useServerFn(listPets);
  const upload = useServerFn(uploadPetAvatar);
  const doUpdate = useServerFn(updatePet);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [favorite, setFavorite] = useState(false);

  const petsQ = useQuery({ queryKey: ["pets"], queryFn: () => fetchPets() });
  const pet = petsQ.data?.find((p) => p.id === petId) ?? null;

  type FieldKey = "birth_date" | "weight_kg" | "notes" | "breed";
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [draftVal, setDraftVal] = useState<string>("");

  const startEdit = (key: FieldKey, current: string) => {
    setEditing(key);
    setDraftVal(current);
  };

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const buf = await file.arrayBuffer();
      return upload({
        data: {
          petId,
          fileBase64: arrayBufferToBase64(buf),
          mimeType: file.type || "image/jpeg",
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pets"] });
      toast.success("Photo updated");
    },
    onError: (e: any) => toast.error(e?.message ?? "Upload failed"),
  });

  const saveMut = useMutation({
    mutationFn: async (patch: Record<string, unknown>) =>
      doUpdate({ data: { id: petId, patch } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pets"] });
      setEditing(null);
      toast.success("Saved");
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  const commit = (key: FieldKey) => {
    const v = draftVal.trim();
    const patch: Record<string, unknown> = {};
    if (key === "weight_kg") {
      if (!v) patch.weight_kg = null;
      else {
        const n = parseFloat(v);
        if (isNaN(n)) {
          setEditing(null);
          return;
        }
        patch.weight_kg = n;
      }
    } else if (key === "birth_date") {
      patch.birth_date = v || null;
    } else {
      patch[key] = v || null;
    }
    saveMut.mutate(patch);
  };

  const age = pet?.birth_date
    ? differenceInYears(new Date(), parseISO(pet.birth_date))
    : null;

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="mx-auto w-full max-w-md px-4 pt-4">
        <header className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate({ to: "/home" })}
            aria-label="Back"
            className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-[var(--shadow-soft)]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="truncate text-base font-semibold">{pet?.name ?? "Pet"}</h1>
          <button
            type="button"
            onClick={() => setFavorite((v) => !v)}
            aria-label="Favorite"
            className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-[var(--shadow-soft)]"
          >
            <Heart
              className={favorite ? "h-5 w-5 fill-[#E85D5D] text-[#E85D5D]" : "h-5 w-5 text-foreground"}
            />
          </button>
        </header>

        {/* Hero photo */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative block w-full overflow-hidden rounded-[28px]"
          style={{
            aspectRatio: "4 / 3.4",
            background: "#EFE3D6",
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.06), 0 12px 28px rgba(0,0,0,0.10)",
          }}
          aria-label="Change photo"
        >
          {pet?.avatar_url ? (
            <img src={pet.avatar_url} alt={pet.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[120px] leading-none">
              {speciesEmoji(pet?.species)}
            </div>
          )}
          <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-[var(--shadow-soft)]">
            <Camera className="h-4 w-4" />
          </span>
          {uploadMut.isPending && (
            <span className="absolute inset-0 grid place-items-center bg-black/30 text-sm text-white">
              Uploading…
            </span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadMut.mutate(f);
            e.target.value = "";
          }}
        />

        {/* Stat tiles — click to edit */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <EditableTile
            label="Age"
            isEditing={editing === "birth_date"}
            onStart={() => startEdit("birth_date", pet?.birth_date ?? "")}
            onCommit={() => commit("birth_date")}
            onCancel={() => setEditing(null)}
            display={
              <>
                <span className="text-2xl font-bold leading-none">
                  {age != null ? String(age) : "—"}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {age != null ? (age === 1 ? "Year" : "Years") : ""}
                </span>
              </>
            }
            input={
              <input
                autoFocus
                type="date"
                value={draftVal}
                onChange={(e) => setDraftVal(e.target.value)}
                onBlur={() => commit("birth_date")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit("birth_date");
                  if (e.key === "Escape") setEditing(null);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            }
          />
          <EditableTile
            label="Weight"
            isEditing={editing === "weight_kg"}
            onStart={() =>
              startEdit("weight_kg", pet?.weight_kg != null ? String(pet.weight_kg) : "")
            }
            onCommit={() => commit("weight_kg")}
            onCancel={() => setEditing(null)}
            display={
              <>
                <span className="text-2xl font-bold leading-none">
                  {pet?.weight_kg != null ? String(pet.weight_kg) : "—"}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {pet?.weight_kg != null ? "Kg" : ""}
                </span>
              </>
            }
            input={
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="number"
                  step="0.1"
                  value={draftVal}
                  onChange={(e) => setDraftVal(e.target.value)}
                  onBlur={() => commit("weight_kg")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commit("weight_kg");
                    if (e.key === "Escape") setEditing(null);
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="—"
                />
                <span className="text-xs font-medium text-muted-foreground">kg</span>
              </div>
            }
          />
        </div>

        {/* About */}
        <div
          className="soft-card mt-3 cursor-text p-4"
          onClick={() => {
            if (editing !== "notes") startEdit("notes", pet?.notes ?? "");
          }}
        >
          <h2 className="text-base font-bold">About</h2>
          {editing === "notes" ? (
            <textarea
              autoFocus
              value={draftVal}
              onChange={(e) => setDraftVal(e.target.value)}
              onBlur={() => commit("notes")}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditing(null);
              }}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary/30"
              placeholder={`Notes about ${pet?.name ?? "your pet"}…`}
            />
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {pet?.notes?.trim()
                ? pet.notes
                : `${pet?.name ?? "Your pet"}${pet?.breed ? ` is a ${pet.breed}` : ""}. Tap to add notes.`}
            </p>
          )}
        </div>

        {/* Breed */}
        <div className="mt-4">
          {editing === "breed" ? (
            <input
              autoFocus
              value={draftVal}
              onChange={(e) => setDraftVal(e.target.value)}
              onBlur={() => commit("breed")}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit("breed");
                if (e.key === "Escape") setEditing(null);
              }}
              placeholder="Breed"
              className="soft-card h-12 w-full px-4 text-sm font-semibold capitalize outline-none focus:ring-2 focus:ring-primary/30"
            />
          ) : (
            <button
              type="button"
              onClick={() => startEdit("breed", pet?.breed ?? "")}
              className="soft-card flex h-12 w-full items-center justify-center px-4 text-sm font-semibold capitalize"
            >
              {pet?.breed?.trim() || pet?.species || "Add breed"}
            </button>
          )}
        </div>
      </div>
      <BottomTabBar />
    </div>
  );
}

function EditableTile({
  label,
  display,
  input,
  isEditing,
  onStart,
}: {
  label: string;
  display: React.ReactNode;
  input: React.ReactNode;
  isEditing: boolean;
  onStart: () => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="soft-card cursor-pointer p-4"
      onClick={() => {
        if (!isEditing) onStart();
      }}
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-muted">
          <PawPrint className="h-3.5 w-3.5" />
        </span>
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        {isEditing ? input : display}
      </div>
    </div>
  );
}
