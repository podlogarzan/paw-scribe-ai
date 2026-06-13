import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SIGN_TTL = 60 * 60 * 24 * 7; // 7 days

function extFromMime(m: string): string {
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("gif")) return "gif";
  if (m.includes("heic")) return "heic";
  return "jpg";
}

export const uploadChatImage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        conversationId: z.string().uuid(),
        mediaType: z.string().min(3).max(100),
        dataBase64: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext = extFromMime(data.mediaType);
    const filename = `${crypto.randomUUID()}.${ext}`;
    const path = `${data.conversationId}/${filename}`;
    const buffer = Buffer.from(data.dataBase64, "base64");
    const { error } = await supabaseAdmin.storage
      .from("chat-photos")
      .upload(path, buffer, { contentType: data.mediaType, upsert: false });
    if (error) throw new Error(error.message);
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("chat-photos")
      .createSignedUrl(path, SIGN_TTL);
    if (sErr) throw new Error(sErr.message);
    return { path, signedUrl: signed.signedUrl, mediaType: data.mediaType };
  });

export const signImagePaths = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ paths: z.array(z.string().min(1)).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    if (data.paths.length === 0) return [] as { path: string; signedUrl: string }[];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.storage
      .from("chat-photos")
      .createSignedUrls(data.paths, SIGN_TTL);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({ path: r.path ?? "", signedUrl: r.signedUrl }));
  });

export type ChatPhoto = {
  path: string;
  signedUrl: string;
  createdAt: string;
  conversationId: string;
  conversationTitle: string | null;
};

export const listChatPhotos = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ petId: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<ChatPhoto[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: convos, error: cErr } = await supabaseAdmin
      .from("conversations")
      .select("id,title")
      .eq("pet_id", data.petId);
    if (cErr) throw new Error(cErr.message);
    const convoIds = (convos ?? []).map((c) => c.id);
    if (convoIds.length === 0) return [];
    const titleMap = new Map((convos ?? []).map((c) => [c.id, c.title]));
    const { data: msgs, error: mErr } = await supabaseAdmin
      .from("messages")
      .select("conversation_id, created_at, image_paths")
      .in("conversation_id", convoIds)
      .not("image_paths", "is", null)
      .order("created_at", { ascending: false });
    if (mErr) throw new Error(mErr.message);

    const flat: { path: string; createdAt: string; conversationId: string }[] = [];
    for (const m of msgs ?? []) {
      for (const p of (m.image_paths ?? []) as string[]) {
        flat.push({ path: p, createdAt: m.created_at, conversationId: m.conversation_id });
      }
    }
    if (flat.length === 0) return [];

    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("chat-photos")
      .createSignedUrls(flat.map((f) => f.path), SIGN_TTL);
    if (sErr) throw new Error(sErr.message);
    const signMap = new Map<string, string>();
    for (const s of signed ?? []) {
      if (s.path) signMap.set(s.path, s.signedUrl);
    }
    return flat.map((f) => ({
      ...f,
      signedUrl: signMap.get(f.path) ?? "",
      conversationTitle: titleMap.get(f.conversationId) ?? null,
    })) as ChatPhoto[];
  });