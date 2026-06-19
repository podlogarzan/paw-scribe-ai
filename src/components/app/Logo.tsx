import { cn } from "@/lib/utils";
import iconBlack from "@/assets/vetyco-icon-black.svg.asset.json";

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <img
      src={iconBlack.url}
      alt="Vetyco"
      className={cn("block rounded-2xl", className)}
      style={{ width: size, height: size }}
    />
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