import { Link, useLocation } from "@tanstack/react-router";
import { CalendarDays, Images, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/home", icon: CalendarDays, label: "Calendar" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/gallery", icon: Images, label: "Gallery" },
] as const;

export function BottomTabBar() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center md:hidden"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
    >
      <ul
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-[#1A1A1A] px-6 py-3"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
      >
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <li key={to}>
              <Link
                to={to}
                aria-label={label}
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200",
                  active ? "text-white" : "text-white/50 hover:text-white/80",
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 1.75} />
                {active && (
                  <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-white" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}