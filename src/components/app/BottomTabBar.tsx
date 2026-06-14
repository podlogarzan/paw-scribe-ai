import { Link, useLocation } from "@tanstack/react-router";
import { Calendar, Images, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/home", icon: Calendar, label: "Calendar" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/gallery", icon: Images, label: "Gallery" },
] as const;

export function BottomTabBar() {
  const { pathname } = useLocation();
  return (
    <nav
      className="sticky bottom-0 z-30 mt-auto border-t border-[#F0F0F0] bg-white/85 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                aria-label={label}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center py-3 transition-all duration-200",
                  active ? "text-primary" : "text-[color:var(--warm)] hover:text-foreground",
                )}
              >
                <Icon
                  className="h-6 w-6"
                  strokeWidth={active ? 2.5 : 1.75}
                  fill={active ? "currentColor" : "none"}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}