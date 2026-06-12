import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const DOC_KINDS = ["passport", "vaccination_card", "lab_result", "insurance", "invoice", "other"] as const;
export type DocKind = (typeof DOC_KINDS)[number];

export type Doc = {
  id: string;
  pet_id: string;
  kind: DocKind;
  label: string;
  storage_path: string;
  mime_type: string | null;
  created_at: string;
  url?: string;
};

export const listDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ petId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("documents")
      .select("*")
      .eq("pet_id", data.petId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const enriched = await Promise.all(
      (rows ?? []).map(async (r: any) => {
        const { data: s } = await supabase.storage.from("documents").createSignedUrl(r.storage_path, 3600);
        return { ...r, url: s?.signedUrl ?? "" };
      }),
    );
    return enriched as Doc[];
  });

export const uploadDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        petId: z.string().uuid(),
        kind: z.enum(DOC_KINDS),
        label: z.string().min(1).max(120),
        fileBase64: z.string(),
        mimeType: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const ext = (data.mimeType.split("/")[1] ?? "bin").split("+")[0];
    const path = `${data.petId}/${data.kind}/${crypto.randomUUID()}.${ext}`;
    const bytes = Uint8Array.from(atob(data.fileBase64), (c) => c.charCodeAt(0));
    const { error: upErr } = await supabase.storage
      .from("documents")
      .upload(path, bytes, { contentType: data.mimeType });
    if (upErr) throw new Error(upErr.message);
    const { data: row, error } = await supabase
      .from("documents")
      .insert({ pet_id: data.petId, kind: data.kind, label: data.label, storage_path: path, mime_type: data.mimeType })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as Doc;
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row } = await supabase.from("documents").select("storage_path").eq("id", data.id).single();
    if (row?.storage_path) {
      await supabase.storage.from("documents").remove([row.storage_path]);
    }
    const { error } = await supabase.from("documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });