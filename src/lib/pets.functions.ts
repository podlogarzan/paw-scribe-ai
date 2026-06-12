import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type Pet = {
  id: string;
  user_id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  sex: string | null;
  neutered: boolean | null;
  weight_kg: number | null;
  microchip_no: string | null;
  allergies: string[] | null;
  notes: string | null;
  avatar_path: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
};

async function signedAvatar(supabase: any, path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("pet-avatars").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export const listPets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.from("pets").select("*").order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const pets: Pet[] = await Promise.all(
      (data ?? []).map(async (p: any) => ({ ...p, avatar_url: await signedAvatar(supabase, p.avatar_path) })),
    );
    return pets;
  });

const PetInput = z.object({
  name: z.string().min(1).max(80),
  species: z.string().min(1),
  breed: z.string().max(120).nullable().optional(),
  birth_date: z.string().nullable().optional(),
  sex: z.string().nullable().optional(),
  neutered: z.boolean().nullable().optional(),
  weight_kg: z.number().nullable().optional(),
  microchip_no: z.string().max(80).nullable().optional(),
  allergies: z.array(z.string()).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const createPet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PetInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: pet, error } = await supabase
      .from("pets")
      .insert({ ...data, user_id: userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return pet as Pet;
  });

export const updatePet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), patch: PetInput.partial() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: pet, error } = await supabase
      .from("pets")
      .update(data.patch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return pet as Pet;
  });

export const deletePet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("pets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const uploadPetAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ petId: z.string().uuid(), fileBase64: z.string(), mimeType: z.string() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const ext = data.mimeType.split("/")[1] ?? "png";
    const path = `${data.petId}/avatar-${Date.now()}.${ext}`;
    const bytes = Uint8Array.from(atob(data.fileBase64), (c) => c.charCodeAt(0));
    const { error: upErr } = await supabase.storage
      .from("pet-avatars")
      .upload(path, bytes, { contentType: data.mimeType, upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { error } = await supabase.from("pets").update({ avatar_path: path }).eq("id", data.petId);
    if (error) throw new Error(error.message);
    const { data: signed } = await supabase.storage.from("pet-avatars").createSignedUrl(path, 3600);
    return { path, url: signed?.signedUrl ?? null };
  });