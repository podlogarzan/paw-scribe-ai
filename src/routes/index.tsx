import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { listPets } from "@/lib/pets.functions";
import { useActivePet } from "@/stores/active-pet";
import wordmark from "@/assets/vetyco-wordmark-white.svg.asset.json";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Vetyco — Pet Health Journal" },
      { name: "description", content: "A calm pet health journal with an AI care companion." },
    ],
  }),
  component: SplashScreen,
});

function SplashScreen() {
  const navigate = useNavigate();
  const fetchPets = useServerFn(listPets);
  const setActivePetId = useActivePet((s) => s.setActivePetId);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Reveal (1600ms) + hold (450ms) ≈ 2.05s minimum on-screen
    const minDelay = new Promise((r) => setTimeout(r, 2050));

    const work = (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return { signedIn: false as const, pets: [] };
      const pets = await fetchPets();
      return { signedIn: true as const, pets };
    })();

    Promise.all([work, minDelay])
      .then(([result]) => {
        if (cancelled) return;
        setLeaving(true);
        setTimeout(() => {
          if (cancelled) return;
          if (!result.signedIn) {
            navigate({ to: "/auth", replace: true });
            return;
          }
          const pets = result.pets;
          if (!pets || pets.length === 0) {
            navigate({ to: "/onboarding", replace: true });
          } else {
            if (!useActivePet.getState().activePetId ||
                !pets.find((p) => p.id === useActivePet.getState().activePetId)) {
              setActivePetId(pets[0].id);
            }
            navigate({ to: "/chat", replace: true });
          }
        }, 300);
      })
      .catch(() => {
        if (cancelled) return;
        navigate({ to: "/auth", replace: true });
      });

    return () => {
      cancelled = true;
    };
  }, [fetchPets, navigate, setActivePetId]);

  return (
    <div
      className="fixed inset-0 z-50 transition-opacity duration-300 ease-out"
      style={{
        backgroundColor: "#7BAF89",
        opacity: leaving ? 0 : 1,
        height: "100dvh",
        width: "100vw",
      }}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <img
          src={wordmark.url}
          alt="Vetyco"
          className="splash-wordmark block"
          style={{ width: "min(60vw, 260px)", height: "auto" }}
        />
      </div>
      <style>{`
        @keyframes splash-unfold {
          0% { opacity: 0; clip-path: inset(0 0 0 100%); }
          100% { opacity: 1; clip-path: inset(0 0 0 0%); }
        }
        .splash-wordmark {
          animation: splash-unfold 1600ms ease-in-out both;
        }
      `}</style>
    </div>
  );
}
