import { ArrowRight } from "lucide-react";
import { speciesEmoji } from "@/lib/species";
import type { Pet } from "@/lib/pets.functions";

const STACK_TINTS = ["#E7C56A", "#D88A4E", "#7BAF89"];

export function PetHeroCard({
  pet,
  onOpen,
}: {
  pet: Pet | null;
  onOpen: () => void;
}) {
  const emoji = speciesEmoji(pet?.species);
  return (
    <div className="relative pt-4">
      {/* Stacked card backdrops */}
      <div
        aria-hidden
        className="absolute inset-x-10 top-0 h-12 rounded-[28px]"
        style={{ background: STACK_TINTS[0] }}
      />
      <div
        aria-hidden
        className="absolute inset-x-6 top-2 h-12 rounded-[28px]"
        style={{ background: STACK_TINTS[1] }}
      />

      <button
        type="button"
        onClick={onOpen}
        className="relative block w-full overflow-hidden rounded-[28px] text-left transition-transform active:scale-[0.99]"
        style={{
          aspectRatio: "4 / 5",
          background: STACK_TINTS[2],
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.06), 0 12px 28px rgba(0,0,0,0.10)",
        }}
      >
        {pet?.avatar_url ? (
          <img
            src={pet.avatar_url}
            alt={pet.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[140px] leading-none">
            <span aria-label={pet?.name ?? "pet"}>{emoji}</span>
          </div>
        )}

        <span className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white text-foreground shadow-[var(--shadow-soft)]">
          <ArrowRight className="h-5 w-5" />
        </span>
      </button>
    </div>
  );
}