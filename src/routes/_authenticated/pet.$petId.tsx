import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Camera, Heart, MessageCircle, PawPrint, Phone } from "lucide-react";
import { differenceInYears, parseISO } from "date-fns";
import { toast } from "sonner";
import { listPets, uploadPetAvatar } from "@/lib/pets.functions";
import { speciesEmoji } from "@/lib/species";
import { Button } from "@/components/ui/button";
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
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [favorite, setFavorite] = useState(false);

  const petsQ = useQuery({ queryKey: ["pets"], queryFn: () => fetchPets() });
  const pet = petsQ.data?.find((p) => p.id === petId) ?? null;

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

        {/* Stat tiles */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatTile label="Age" value={age != null ? String(age) : "—"} unit={age != null ? (age === 1 ? "Year" : "Years") : ""} />
          <StatTile
            label="Weight"
            value={pet?.weight_kg != null ? String(pet.weight_kg) : "—"}
            unit={pet?.weight_kg != null ? "Kg" : ""}
          />
        </div>

        {/* About */}
        <div className="soft-card mt-3 p-4">
          <h2 className="text-base font-bold">About</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {pet?.notes?.trim()
              ? pet.notes
              : `${pet?.name ?? "Your pet"}${pet?.breed ? ` is a ${pet.breed}` : ""}. Add notes about allergies, fears, and quirks from the profile editor.`}
          </p>
        </div>

        {/* Action row */}
        <div className="mt-4 flex items-center gap-3">
          <div className="soft-card flex flex-1 items-center justify-center px-4 py-3 text-sm font-semibold capitalize">
            {pet?.breed?.trim() || pet?.species || "Pet"}
          </div>
          <button
            type="button"
            aria-label="Paw"
            className="grid h-12 w-12 place-items-center rounded-full bg-[#7BAF89] text-white shadow-[var(--shadow-soft)]"
          >
            <PawPrint className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Call"
            className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-[var(--shadow-soft)]"
          >
            <Phone className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Chat"
            onClick={() => navigate({ to: "/chat" })}
            className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-[var(--shadow-soft)]"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>

        <Button
          variant="outline"
          className="mt-4 h-12 w-full rounded-full"
          onClick={() => navigate({ to: "/profile" })}
        >
          Manage pet details
        </Button>
      </div>
      <BottomTabBar />
    </div>
  );
}

function StatTile({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="soft-card p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-muted">
          <PawPrint className="h-3.5 w-3.5" />
        </span>
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-bold leading-none">{value}</span>
        <span className="text-xs font-medium text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}