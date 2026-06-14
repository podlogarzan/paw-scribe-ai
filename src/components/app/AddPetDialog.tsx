import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createPet } from "@/lib/pets.functions";
import { useActivePet } from "@/stores/active-pet";

export function AddPetDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const create = useServerFn(createPet);
  const setActivePetId = useActivePet((s) => s.setActivePetId);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");

  const mut = useMutation({
    mutationFn: () => create({ data: { name: name.trim(), species } }),
    onSuccess: (pet) => {
      setActivePetId(pet.id);
      qc.invalidateQueries({ queryKey: ["pets"] });
      toast.success(`${pet.name} added`);
      onOpenChange(false);
      setName("");
      setSpecies("dog");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not add"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add a pet</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="ap-name">Name</Label>
            <Input
              id="ap-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ap-species">Species</Label>
            <Select value={species} onValueChange={setSpecies}>
              <SelectTrigger id="ap-species">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">Dog</SelectItem>
                <SelectItem value="cat">Cat</SelectItem>
                <SelectItem value="rabbit">Rabbit</SelectItem>
                <SelectItem value="bird">Bird</SelectItem>
                <SelectItem value="reptile">Reptile</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mut.mutate()}
            disabled={!name.trim() || mut.isPending}
          >
            {mut.isPending ? "Saving…" : "Add pet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}