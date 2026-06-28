import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/legal/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <AppShell>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/settings" })}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-sm font-semibold">Privacy Policy</h1>
        <div className="w-[68px]" />
      </header>
      <main className="mx-auto w-full max-w-xl px-4 py-6">
        <div className="soft-card p-5">
          <h2 className="mb-2 text-lg font-semibold">Privacy Policy</h2>
          <p className="text-sm text-muted-foreground">
            Full policy coming soon. Questions? Contact support@vetyco.com.
          </p>
        </div>
      </main>
    </AppShell>
  );
}