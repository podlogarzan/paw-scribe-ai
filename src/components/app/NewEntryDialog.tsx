import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createEntry, ENTRY_TYPES, type EntryType } from "@/lib/entries.functions";
import { ENTRY_LABEL } from "@/components/app/EntryDot";

export function NewEntryDialog({
  petId,
  open,
  onOpenChange,
  defaultDate,
}: {
  petId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDate?: Date;
}) {
  const create = useServerFn(createEntry);
  const qc = useQueryClient();
  const [type, setType] = useState<EntryType>("appointment");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [when, setWhen] = useState(
    format(defaultDate ?? new Date(), "yyyy-MM-dd'T'HH:mm"),
  );

  const mutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          pet_id: petId,
          type,
          title: title.trim(),
          description: description.trim() || null,
          occurred_at: new Date(when).toISOString(),
        },
      }),
    onSuccess: () => {
      toast.success("Entry added");
      qc.invalidateQueries({ queryKey: ["entries"] });
      onOpenChange(false);
      setTitle("");
      setDescription("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save entry"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>New entry</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as EntryType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENTRY_TYPES.filter((t) => t !== "ai_log").map((t) => (
                  <SelectItem key={t} value={t}>{ENTRY_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ne-title">Title</Label>
            <Input
              id="ne-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Annual check-up"
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ne-when">Date &amp; time</Label>
            <Input id="ne-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ne-desc">Notes</Label>
            <Textarea id="ne-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !title.trim()}>
            {mutation.isPending ? "Saving…" : "Save entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}