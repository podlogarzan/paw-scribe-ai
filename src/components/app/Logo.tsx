import { cn } from "@/lib/utils";

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
      aria-label="Vetyco"
    >
      v
    </div>
  );
}

export function LogoWordmark({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={size} />
      <span
        className="font-semibold tracking-tight text-foreground"
        style={{ fontSize: Math.round(size * 0.55) }}
      >
        vetyco
      </span>
    </div>
  );
}