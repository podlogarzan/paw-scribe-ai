import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { speciesEmoji } from "@/lib/species";

export function PetAvatar({
  name,
  url,
  size = 40,
  species,
  className,
}: {
  name: string;
  url?: string | null;
  size?: number;
  species?: string | null;
  className?: string;
}) {
  const emoji = speciesEmoji(species);
  return (
    <Avatar
      className={cn("bg-[color:var(--ai-soft)] ring-1 ring-border", className)}
      style={{ width: size, height: size }}
    >
      {url ? <AvatarImage src={url} alt={name} /> : null}
      <span
        className="flex h-full w-full items-center justify-center"
        style={{ fontSize: Math.round(size * 0.55) }}
        aria-label={name}
      >
        {emoji}
      </span>
    </Avatar>
  );
}