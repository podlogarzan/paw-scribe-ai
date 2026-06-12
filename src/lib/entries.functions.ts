import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const ENTRY_TYPES = ["appointment", "vaccination", "health_issue", "note", "ai_log"] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export type Entry = {
  id: string;
  pet_id: string;
  type: EntryType;
  title: string;
  description: string | null;
  occurred_at: string;
  created_by: "user" | "ai";
  source_conversation_id: string | null;
  reminder_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EntryWithPhotos = Entry & { photos: { id: string; url: string; storage_path: string }[] };

export const listEntriesForPet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ petId: z.string().uuid(), fromIso: z.string().optional(), toIso: z.string().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase.from("entries").select("*").eq("pet_id", data.petId).order("occurred_at", { ascending: false });
    if (data.fromIso) q = q.gte("occurred_at", data.fromIso);
    if (data.toIso) q = q.lt("occurred_at", data.toIso);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as Entry[];
  });

export const upcomingEntries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ petId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("entries")
      .select("*")
      .eq("pet_id", data.petId)
      .gte("occurred_at", new Date().toISOString())
      .order("occurred_at", { ascending: true })
      .limit(3);
    if (error) throw new Error(error.message);
    return (rows ?? []) as Entry[];
  });

export const getEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase.from("entries").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    const { data: photos } = await supabase.from("entry_photos").select("*").eq("entry_id", data.id);
    const enriched = await Promise.all(
      (photos ?? []).map(async (p: any) => {
        const { data: signed } = await supabase.storage.from("entry-photos").createSignedUrl(p.storage_path, 3600);
        return { id: p.id, url: signed?.signedUrl ?? "", storage_path: p.storage_path };
      }),
    );
    return { ...(row as Entry), photos: enriched } as EntryWithPhotos;
  });

const EntryInput = z.object({
  pet_id: z.string().uuid(),
  type: z.enum(ENTRY_TYPES),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).nullable().optional(),
  occurred_at: z.string(),
  reminder_at: z.string().nullable().optional(),
});

export const createEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EntryInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase.from("entries").insert(data).select("*").single();
    if (error) throw new Error(error.message);
    return row as Entry;
  });

export const updateEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), patch: EntryInput.partial() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase.from("entries").update(data.patch).eq("id", data.id).select("*").single();
    if (error) throw new Error(error.message);
    return row as Entry;
  });

export const deleteEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("entries").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addEntryPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ entryId: z.string().uuid(), fileBase64: z.string(), mimeType: z.string() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const ext = data.mimeType.split("/")[1] ?? "png";
    const path = `${data.entryId}/${crypto.randomUUID()}.${ext}`;
    const bytes = Uint8Array.from(atob(data.fileBase64), (c) => c.charCodeAt(0));
    const { error: upErr } = await supabase.storage
      .from("entry-photos")
      .upload(path, bytes, { contentType: data.mimeType });
    if (upErr) throw new Error(upErr.message);
    const { error } = await supabase
      .from("entry_photos")
      .insert({ entry_id: data.entryId, storage_path: path, mime_type: data.mimeType });
    if (error) throw new Error(error.message);
    return { path };
  });