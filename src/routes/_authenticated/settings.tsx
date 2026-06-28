import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, LogOut, Mail, PawPrint, Shield, FileText, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

function Row({
  icon,
  label,
  onClick,
  href,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  destructive?: boolean;
}) {
  const cls = `flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium ${
    destructive ? "text-destructive" : ""
  }`;
  const content = (
    <>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-muted">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </>
  );
  if (href) {
    return (
      <a href={href} className={cls}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {content}
    </button>
  );
}

function SettingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [email, setEmail] = useState<string>("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/home" })}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-sm font-semibold">Settings</h1>
        <div className="w-[68px]" />
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6">
        <section>
          <SectionLabel>Account</SectionLabel>
          <div className="soft-card px-4 py-3.5">
            <p className="text-[11px] font-medium text-muted-foreground">Signed in as</p>
            <p className="truncate text-sm font-semibold">{email || "—"}</p>
          </div>
        </section>

        <section>
          <SectionLabel>Manage pets</SectionLabel>
          <div className="soft-card overflow-hidden">
            <Row
              icon={<PawPrint className="h-4 w-4" />}
              label="Manage pets"
              onClick={() => navigate({ to: "/profile" })}
            />
          </div>
        </section>

        <section>
          <SectionLabel>Legal</SectionLabel>
          <div className="soft-card divide-y divide-border overflow-hidden">
            <Row
              icon={<Shield className="h-4 w-4" />}
              label="Privacy Policy"
              onClick={() => navigate({ to: "/legal/privacy" })}
            />
            <Row
              icon={<FileText className="h-4 w-4" />}
              label="Terms of Service"
              onClick={() => navigate({ to: "/legal/terms" })}
            />
          </div>
        </section>

        <section>
          <SectionLabel>Feedback</SectionLabel>
          <div className="soft-card overflow-hidden">
            <Row
              icon={<Mail className="h-4 w-4" />}
              label="Send feedback"
              href="mailto:feedback@vetyco.com?subject=Vetyco%20feedback"
            />
          </div>
        </section>

        <section>
          <div className="soft-card overflow-hidden">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-muted">
                <LogOut className="h-4 w-4" />
              </span>
              <span className="flex-1">Sign out</span>
            </button>
          </div>
        </section>

        <Separator />

        <section>
          <div className="soft-card overflow-hidden">
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-destructive"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </span>
              <span className="flex-1">Delete account</span>
            </button>
          </div>
        </section>
      </main>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              Account deletion isn't available yet. Please email support@vetyco.com to request
              deletion of your account and data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDeleteOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}