import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/legal/terms")({
  component: TermsPage,
});

function TermsPage() {
  const navigate = useNavigate();
  return (
    <AppShell>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/settings" })}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-sm font-semibold">Terms of Service</h1>
        <div className="w-[68px]" />
      </header>
      <main className="mx-auto w-full max-w-xl px-4 py-6">
        <article className="soft-card space-y-5 p-5 text-sm leading-relaxed text-foreground">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold">Terms of Service</h2>
            <p className="text-xs text-muted-foreground">Last updated: 29.06.2026</p>
          </header>

          <p>
            Welcome to Vetyco. By using our app, you agree to these Terms of Service ("Terms").
            Please read them carefully.
          </p>

          <section className="space-y-2">
            <h3 className="font-semibold">1. Description of Service</h3>
            <p>
              Vetyco is an AI-powered companion app that helps pet owners track their pet's health,
              log entries, store photos/documents, and chat with an AI assistant for general
              guidance and information.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">2. Not Veterinary Advice — Important Disclaimer</h3>
            <p>
              Vetyco's AI assistant is not a veterinarian and does not provide professional
              veterinary, medical, or emergency advice. Information provided by the AI is for
              general informational and organizational purposes only.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Always consult a licensed veterinarian for diagnosis, treatment, or any health decisions concerning your pet.</li>
              <li>In case of a pet emergency, contact your veterinarian or local emergency animal hospital immediately — do not rely on this app.</li>
              <li>We are not liable for any decisions made based on information provided through the app.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">3. Accounts</h3>
            <p>
              You're responsible for maintaining the confidentiality of your account credentials
              and for all activity under your account. You must provide accurate information when
              creating an account.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">4. Subscription & Payments</h3>
            <p>
              [To be finalized once subscription launches.] Where applicable, subscription fees,
              billing cycles, and cancellation terms will be clearly disclosed at the point of
              purchase. You may cancel your subscription at any time; access continues until the
              end of the current billing period.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">5. Acceptable Use</h3>
            <p>You agree not to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Use the service for any unlawful purpose.</li>
              <li>Attempt to reverse-engineer, scrape, or disrupt the service.</li>
              <li>Upload content that infringes on others' rights or is abusive, harmful, or illegal.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">6. Intellectual Property</h3>
            <p>
              The Vetyco app, branding, and underlying software are owned by us. You retain
              ownership of the content you upload (photos, notes, etc.), and grant us a limited
              license to store and process it solely to provide the service to you.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">7. Limitation of Liability</h3>
            <p>
              To the maximum extent permitted by law, Vetyco and its operator shall not be liable
              for any indirect, incidental, or consequential damages arising from your use of the
              app, including but not limited to reliance on AI-generated information.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">8. Termination</h3>
            <p>
              We may suspend or terminate your account if you violate these Terms. You may stop
              using the service and request account deletion at any time.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">9. Governing Law</h3>
            <p>
              These Terms are governed by the laws of Slovenia and the European Union, without
              regard to conflict-of-law principles.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">10. Changes to These Terms</h3>
            <p>
              We may update these Terms from time to time. Continued use of the app after changes
              constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">11. Contact</h3>
            <p>Questions about these Terms? Email us at z.podlogar@alopa.studio.</p>
          </section>
        </article>
      </main>
    </AppShell>
  );
}