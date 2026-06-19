import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import iconBlack from "@/assets/vetyco-icon-black.svg.asset.json";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function AppHeader({ title: _title }: { title?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      const meta = (u?.user_metadata ?? {}) as Record<string, any>;
      const display =
        meta.full_name ||
        meta.name ||
        (u?.email ? u.email.split("@")[0] : "") ||
        "";
      setName(display);
    });
  }, []);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/chat", replace: true });
  }

  return (
    <header className="px-4 pt-5 pb-2 md:hidden">
      <div className="flex items-center justify-between gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex min-w-0 items-center gap-3 rounded-full text-left"
              aria-label="Account menu"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-[var(--shadow-soft)]">
                <img src={iconBlack.url} alt="Vetyco" className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {getGreeting()}!
                </p>
                <p className="truncate text-base font-bold leading-tight">
                  {name || "Welcome"}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
              <User className="h-4 w-4" /> Manage pets
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          aria-label="Notifications"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white shadow-[var(--shadow-soft)]"
        >
          <Bell className="h-5 w-5 text-foreground" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}