import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getOrCreateLatestConversation } from "@/lib/conversations.functions";
import { useActivePet } from "@/stores/active-pet";

export const Route = createFileRoute("/_authenticated/chat")({
  component: () => <Outlet />,
});

// Pathless redirect handled via /_authenticated/chat/index.tsx below.
export function ChatIndex() {
  const navigate = useNavigate();
  const activePetId = useActivePet((s) => s.activePetId);
  const getOrCreate = useServerFn(getOrCreateLatestConversation);

  useEffect(() => {
    if (!activePetId) {
      navigate({ to: "/home", replace: true });
      return;
    }
    getOrCreate({ data: { petId: activePetId } }).then((c) => {
      navigate({ to: "/chat/$threadId", params: { threadId: c.id }, replace: true });
    });
  }, [activePetId, getOrCreate, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Opening chat…</p>
    </div>
  );
}