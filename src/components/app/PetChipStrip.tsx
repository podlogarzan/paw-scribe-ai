import { Plus } from "lucide-react";
import { PetAvatar } from "@/components/app/PetAvatar";
import { cn } from "@/lib/utils";
import type { Pet } from "@/lib/pets.functions";

export function PetChipStrip({
  pets,
  activePetId,
  onSelect,
  onAdd,
}: {
  pets: Pet[];
  activePetId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {pets.map((p) => {
        const active = p.id === activePetId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-semibold transition-all",
              active
                ? "bg-[#7BAF89] text-white shadow-[var(--shadow-soft)]"
                : "bg-white text-foreground shadow-[var(--shadow-soft)]",
            )}
          >
            <PetAvatar
              name={p.name}
              url={p.avatar_url}
              species={p.species}
              size={32}
              className="ring-0"
            />
            <span>{p.name}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        aria-label="Add pet"
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-[var(--shadow-soft)]"
      >
        <Plus className="h-4 w-4" />
        Add
      </button>
    </div>
  );
}