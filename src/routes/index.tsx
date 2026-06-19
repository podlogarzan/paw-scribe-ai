import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { listPets } from "@/lib/pets.functions";
import { useActivePet } from "@/stores/active-pet";

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
    const minDelay = new Promise((r) => setTimeout(r, 1400));

    const work = (async () => {
      let { data } = await supabase.auth.getUser();
      if (!data.user) {
        const { data: anon, error } = await supabase.auth.signInAnonymously();
        if (error || !anon.user) throw error ?? new Error("Failed to start session");
        data = { user: anon.user };
      }
      const pets = await fetchPets();
      return pets;
    })();

    Promise.all([work, minDelay])
      .then(([pets]) => {
        if (cancelled) return;
        setLeaving(true);
        setTimeout(() => {
          if (cancelled) return;
          if (!pets || pets.length === 0) {
            navigate({ to: "/onboarding", replace: true });
          } else {
            if (!useActivePet.getState().activePetId ||
                !pets.find((p) => p.id === useActivePet.getState().activePetId)) {
              setActivePetId(pets[0].id);
            }
            navigate({ to: "/chat", replace: true });
          }
        }, 450);
      })
      .catch(() => {
        if (cancelled) return;
        navigate({ to: "/onboarding", replace: true });
      });

    return () => {
      cancelled = true;
    };
  }, [fetchPets, navigate, setActivePetId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ease-out"
      style={{
        backgroundColor: "#7BAF89",
        opacity: leaving ? 0 : 1,
      }}
    >
      <div
        className="flex items-center justify-center rounded-3xl bg-white/95 shadow-2xl"
        style={{
          width: 112,
          height: 112,
          animation: "splash-reveal 900ms cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
        aria-label="Vetyco"
      >
        <span
          className="font-bold leading-none"
          style={{ color: "#7BAF89", fontSize: 64 }}
        >
          v
        </span>
      </div>
      <style>{`
        @keyframes splash-reveal {
          0% { opacity: 0; transform: scale(0.86); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
