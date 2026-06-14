import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { ImageOff, X } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { AppShell } from "@/components/app/AppShell";
import { AppHeader } from "@/components/app/AppHeader";
import { BottomTabBar } from "@/components/app/BottomTabBar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { listChatPhotos, type ChatPhoto } from "@/lib/chat-images.functions";
import { useActivePet } from "@/stores/active-pet";

export const Route = createFileRoute("/_authenticated/gallery")({
  component: GalleryPage,
});

function GalleryPage() {
  const navigate = useNavigate();
  const activePetId = useActivePet((s) => s.activePetId);
  const fetchPhotos = useServerFn(listChatPhotos);
  const [active, setActive] = useState<ChatPhoto | null>(null);

  useEffect(() => {
    if (!activePetId) navigate({ to: "/home", replace: true });
  }, [activePetId, navigate]);

  const q = useQuery({
    queryKey: ["gallery", activePetId],
    queryFn: () => fetchPhotos({ data: { petId: activePetId! } }),
    enabled: !!activePetId,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, ChatPhoto[]>();
    for (const p of q.data ?? []) {
      const key = format(new Date(p.createdAt), "MMMM yyyy");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries());
  }, [q.data]);

  return (
    <AppShell>
      <AppHeader title="Gallery" />
      <div className="flex-1 overflow-y-auto bg-background px-3 pb-32 pt-4 md:px-6">
        {q.isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (q.data ?? []).length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <ImageOff className="h-7 w-7" />
            </div>
            <h3 className="mt-3 text-base font-semibold">No photos yet</h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Photos you send in chat will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([month, items]) => (
              <section key={month}>
                <h2 className="mb-3 text-base font-bold text-foreground">
                  {month}
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {items.map((p) => (
                    <button
                      key={p.path}
                      type="button"
                      onClick={() => setActive(p)}
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-muted transition-transform hover:scale-[1.01]"
                    >
                      <img
                        src={p.signedUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="h-[100dvh] w-screen max-w-none border-0 bg-black/95 p-0 sm:rounded-none">
          {active && (
            <div className="relative flex h-full w-full flex-col">
              <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => setActive(null)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <TransformWrapper doubleClick={{ mode: "toggle" }} maxScale={6} minScale={1}>
                  <TransformComponent
                    wrapperStyle={{ width: "100%", height: "100%" }}
                    contentStyle={{ width: "100%", height: "100%" }}
                  >
                    <img
                      src={active.signedUrl}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </TransformComponent>
                </TransformWrapper>
              </div>
              <div className="bg-black/70 px-4 py-3 text-xs text-white/80">
                <div>{format(new Date(active.createdAt), "PPP")}</div>
                <button
                  className="mt-0.5 truncate text-white underline-offset-2 hover:underline"
                  onClick={() => {
                    setActive(null);
                    navigate({
                      to: "/chat/$threadId",
                      params: { threadId: active.conversationId },
                    });
                  }}
                >
                  {active.conversationTitle || "Open conversation"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomTabBar />
    </AppShell>
  );
}