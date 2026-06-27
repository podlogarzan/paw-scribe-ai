import { cn } from "@/lib/utils";

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 270 270"
      role="img"
      aria-label="Vetyco"
      className={cn("block", className)}
      style={{ width: size, height: size, color: "currentColor" }}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M146.767 123.719H215.012C224.746 123.719 232.636 131.61 232.636 141.343V211.839C232.636 221.572 224.746 229.463 215.012 229.463H76.958C61.587 229.463 53.583 211.16 64.018 199.874L126.064 132.773C131.401 127.001 138.906 123.719 146.767 123.719Z" />
      <path d="M182.936 64.151C182.936 51.108 193.509 40.535 206.552 40.535H209.019C222.062 40.535 232.635 51.108 232.635 64.151V82.832C232.635 95.875 222.062 106.449 209.019 106.449H206.552C193.509 106.449 182.936 95.875 182.936 82.832V64.151Z" />
      <path d="M109.973 64.151C109.973 51.108 120.546 40.535 133.589 40.535H136.057C149.1 40.535 159.673 51.108 159.673 64.151V82.832C159.673 95.875 149.1 106.449 136.057 106.449H133.589C120.546 106.449 109.973 95.875 109.973 82.832V64.151Z" />
      <path d="M37.363 109.268C37.363 96.225 47.936 85.652 60.979 85.652H63.446C76.489 85.652 87.063 96.225 87.063 109.268V127.95C87.063 140.992 76.489 151.566 63.446 151.566H60.979C47.936 151.566 37.363 140.992 37.363 127.95V109.268Z" />
    </svg>
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