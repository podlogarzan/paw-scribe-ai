import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Conversation = {
  id: string;
  pet_id: string;
  title: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  image_paths: string[] | null;
  created_entry_id: string | null;
  created_at: string;
};

export const listConversations = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ petId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("pet_id", data.petId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as Conversation[];
  });

export const getOrCreateLatestConversation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ petId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("pet_id", data.petId)
      .order("updated_at", { ascending: false })
      .limit(1);
    if (rows && rows.length > 0) return rows[0] as Conversation;
    const { data: created, error } = await supabaseAdmin
      .from("conversations")
      .insert({ pet_id: data.petId, title: "New conversation" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return created as Conversation;
  });

export const createConversation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ petId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin
      .from("conversations")
      .insert({ pet_id: data.petId, title: "New conversation" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return created as Conversation;
  });

export const getMessages = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ conversationId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const messages = (rows ?? []) as ChatMessage[];
    const allPaths = Array.from(
      new Set(
        messages.flatMap((m) => (m.image_paths ?? []) as string[]),
      ),
    );
    const signMap = new Map<string, string>();
    if (allPaths.length > 0) {
      const { data: signed } = await supabaseAdmin.storage
        .from("chat-photos")
        .createSignedUrls(allPaths, 60 * 60 * 24 * 7);
      for (const s of signed ?? []) {
        if (s.path && s.signedUrl) signMap.set(s.path, s.signedUrl);
      }
    }
    const entryIds = Array.from(
      new Set(messages.map((m) => m.created_entry_id).filter((v): v is string => !!v)),
    );
    const entryMap = new Map<string, { id: string; title: string }>();
    if (entryIds.length > 0) {
      const { data: ents } = await supabaseAdmin
        .from("entries")
        .select("id,title")
        .in("id", entryIds);
      for (const e of ents ?? []) entryMap.set(e.id, { id: e.id, title: e.title });
    }
    return messages.map((m) => ({
      ...m,
      image_urls: (m.image_paths ?? [])
        .map((p) => signMap.get(p))
        .filter((u): u is string => !!u),
      entry: m.created_entry_id ? entryMap.get(m.created_entry_id) ?? null : null,
    }));
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("conversations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const undoAiEntry = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ entryId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: e } = await supabaseAdmin.from("entries").select("created_by").eq("id", data.entryId).single();
    if (!e || e.created_by !== "ai") throw new Error("Cannot undo this entry");
    const { error } = await supabaseAdmin.from("entries").delete().eq("id", data.entryId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createAiEntryFromAutolog = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        conversationId: z.string().uuid(),
        petId: z.string().uuid(),
        type: z.enum(["appointment", "vaccination", "health_issue", "note"]),
        title: z.string().min(1).max(200),
        description: z.string().max(4000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const occurredAt = new Date().toISOString();
    console.log("[auto_log] inserting entry", {
      petId: data.petId,
      conversationId: data.conversationId,
      type: data.type,
      title: data.title,
      occurred_at: occurredAt,
    });
    const { data: entry, error } = await supabaseAdmin
      .from("entries")
      .insert({
        pet_id: data.petId,
        type: data.type,
        title: data.title,
        description: data.description ?? null,
        occurred_at: occurredAt,
        created_by: "ai",
        source_conversation_id: data.conversationId,
      })
      .select("id,title")
      .single();
    if (error) {
      console.error("[auto_log] insert failed", error);
      throw new Error(error.message);
    }
    console.log("[auto_log] inserted entry", entry);
    const { data: lastMsg } = await supabaseAdmin
      .from("messages")
      .select("id")
      .eq("conversation_id", data.conversationId)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastMsg) {
      await supabaseAdmin
        .from("messages")
        .update({ created_entry_id: entry.id })
        .eq("id", lastMsg.id);
    }
    return entry as { id: string; title: string };
  });