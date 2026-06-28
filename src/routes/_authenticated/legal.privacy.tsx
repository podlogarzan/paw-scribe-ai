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
        <article className="soft-card space-y-5 p-5 text-sm leading-relaxed text-foreground">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold">Privacy Policy</h2>
            <p className="text-xs text-muted-foreground">Last updated: 29.06.2026</p>
          </header>

          <p>
            Vetyco ("we", "us", "our") provides an AI-powered companion app to help you track and
            understand your pet's health. This Privacy Policy explains what information we collect,
            how we use it, and your rights regarding that information.
          </p>

          <section className="space-y-2">
            <h3 className="font-semibold">1. Information We Collect</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li><span className="font-medium">Account information:</span> your email address, used to create and secure your account.</li>
              <li><span className="font-medium">Pet information:</span> name, species, breed, birthday, sex, and any notes you choose to add about your pet.</li>
              <li><span className="font-medium">Health data you provide:</span> messages you send in chat, health log entries, photos, and documents you upload related to your pet's care.</li>
              <li><span className="font-medium">Usage data:</span> basic technical information (such as device/browser type) needed to operate the app reliably.</li>
            </ul>
            <p>We do not knowingly collect information from children under 16. Vetyco is intended for adult pet owners.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">2. How We Use Your Information</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>To provide the core functionality of the app: AI chat responses, health calendar entries, photo/document storage, and pet profile management.</li>
              <li>To personalize AI responses based on your pet's species and breed.</li>
              <li>To communicate with you about your account (e.g. important service updates).</li>
              <li>To improve the app's reliability and features.</li>
            </ul>
            <p>We do not sell your personal data to third parties, and we do not use your pet's health data for advertising purposes.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">3. Third-Party Service Providers</h3>
            <p>We use the following service providers to operate Vetyco. Each processes data only as needed to provide their service to us:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><span className="font-medium">Supabase</span> — database, authentication, and file storage.</li>
              <li><span className="font-medium">AI model provider(s)</span> (e.g. Google Gemini, or another LLM provider via our AI gateway) — to generate chat responses. Messages you send in chat may be processed by these providers to generate a response.</li>
              <li><span className="font-medium">Payment processor</span> (when subscriptions launch) — to process payments securely. We do not store your card details ourselves.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">4. Data Storage & Security</h3>
            <p>
              Your data is stored using industry-standard infrastructure (Supabase) with encryption
              in transit. We take reasonable technical and organizational measures to protect your
              information, but no system is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">5. Your Rights (GDPR)</h3>
            <p>If you are in the EU/EEA, you have the right to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Export your data in a portable format.</li>
              <li>Withdraw consent at any time.</li>
            </ul>
            <p>To exercise any of these rights, contact us at z.podlogar@alopa.studio. We aim to respond within 30 days.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">6. Data Retention</h3>
            <p>
              We retain your account and pet data for as long as your account is active. If you
              request account deletion, we will delete your personal data within a reasonable
              timeframe, except where we're legally required to retain certain records.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">7. Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. We'll notify you of material
              changes via email or an in-app notice.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">8. Contact</h3>
            <p>Questions about this policy? Email us at z.podlogar@alopa.studio.</p>
          </section>
        </article>
      </main>
    </AppShell>
  );
}