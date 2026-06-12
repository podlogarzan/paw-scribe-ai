import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function PetAvatar({
  name,
  url,
  size = 40,
  className,
}: {
  name: string;
  url?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <Avatar
      className={cn("border border-border bg-accent", className)}
      style={{ width: size, height: size }}
    >
      {url ? <AvatarImage src={url} alt={name} /> : null}
      <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
        {initials || "🐾"}
      </AvatarFallback>
    </Avatar>
  );
}