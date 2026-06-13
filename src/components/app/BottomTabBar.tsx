import { Link, useLocation } from "@tanstack/react-router";
import { CalendarDays, Images, MessageCircleHeart } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/home", icon: CalendarDays, label: "Calendar" },
  { to: "/chat", icon: MessageCircleHeart, label: "Chat" },
  { to: "/gallery", icon: Images, label: "Gallery" },
] as const;

export function BottomTabBar() {
  const { pathname } = useLocation();
  return (
    <nav
      className="sticky bottom-0 z-30 mt-auto border-t border-border bg-card/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "fill-primary/10")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}