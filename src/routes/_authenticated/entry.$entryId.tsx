import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { ArrowLeft, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { EntryBadge } from "@/components/app/EntryDot";
import { Button } from "@/components/ui/button";
import { getEntry, deleteEntry, type EntryType } from "@/lib/entries.functions";

export const Route = createFileRoute("/_authenticated/entry/$entryId")({
  component: EntryPage,
});

function EntryPage() {
  const { entryId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchEntry = useServerFn(getEntry);
  const del = useServerFn(deleteEntry);

  const q = useQuery({
    queryKey: ["entry", entryId],
    queryFn: () => fetchEntry({ data: { id: entryId } }),
  });

  const delMut = useMutation({
    mutationFn: () => del({ data: { id: entryId } }),
    onSuccess: () => {
      toast.success("Entry deleted");
      qc.invalidateQueries({ queryKey: ["entries"] });
      navigate({ to: "/home" });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not delete"),
  });

  return (
    <AppShell>
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/home" })}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </header>
      <main className="flex-1 px-4 py-4">
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : q.data ? (
          <article className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <EntryBadge type={q.data.type as EntryType} />
              {q.data.created_by === "ai" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--ai-soft)] px-2 py-0.5 text-xs font-semibold text-[color:var(--ai)]">
                  <Sparkles className="h-3 w-3" /> Logged by AI
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold leading-tight">{q.data.title}</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(q.data.occurred_at), "EEEE, MMM d yyyy · h:mm a")}
            </p>
            {q.data.description && (
              <div className="soft-card whitespace-pre-wrap p-4 text-sm leading-relaxed">
                {q.data.description}
              </div>
            )}
            {q.data.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {q.data.photos.map((p) => (
                  <img key={p.id} src={p.url} alt="" className="aspect-square w-full rounded-xl object-cover" />
                ))}
              </div>
            )}
            <Button
              variant="ghost"
              className="mt-6 text-destructive hover:text-destructive"
              onClick={() => delMut.mutate()}
              disabled={delMut.isPending}
            >
              <Trash2 className="h-4 w-4" /> Delete entry
            </Button>
          </article>
        ) : (
          <p className="text-sm text-muted-foreground">Entry not found.</p>
        )}
      </main>
    </AppShell>
  );
}