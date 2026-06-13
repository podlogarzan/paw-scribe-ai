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
    return (rows ?? []) as ChatMessage[];
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