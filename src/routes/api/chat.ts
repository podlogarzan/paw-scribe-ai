import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are a calm, caring AI companion inside PetVet, a personal pet health journal.

You help owners track their pet's health, think through symptoms, and remember appointments. You are NOT a veterinarian and you must say so when health questions become serious. For any sign of emergency (difficulty breathing, collapse, seizures, severe bleeding, suspected poisoning, bloated abdomen, repeated vomiting, no urination for many hours), respond first with a single, prominent line asking the owner to contact their vet or an emergency clinic immediately. Be warm, concise, and use plain language. Avoid medical jargon unless the owner uses it first. Do not invent medication doses.

When the owner mentions something worth recording (a symptom, an appointment, a vaccination, a weight, a note), end your reply with a single JSON block on its own line so the app can log it:
<auto_log>{"type":"appointment|vaccination|health_issue|note","title":"...","description":"..."}</auto_log>
The "type" must be exactly one of: appointment, vaccination, health_issue, note. Only include the block when there is something concrete to log. Never include more than one block. Never wrap it in code fences. Do NOT include a date — the app will stamp it with today's date automatically.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          messages?: UIMessage[];
          conversationId?: string;
          petId?: string;
        };
        const incoming = body.messages;
        if (!Array.isArray(incoming)) {
          return new Response("messages required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(incoming),
        });

        const response = result.toUIMessageStreamResponse({
          originalMessages: incoming,
          onFinish: async ({ messages }) => {
            if (!body.conversationId) return;
            try {
              const { supabaseAdmin: supabase } = await import("@/integrations/supabase/client.server");

              const last = messages[messages.length - 1];
              const userMsg = incoming[incoming.length - 1];
              const rawUserText = userMsg?.parts
                ?.map((p: any) => (p.type === "text" ? p.text : ""))
                .join("") ?? "";
              const userText = rawUserText === "(image)" ? "" : rawUserText;
              const assistantText = last?.parts
                ?.map((p: any) => (p.type === "text" ? p.text : ""))
                .join("") ?? "";

              // Extract image storage paths from user message file parts
              const userImagePaths: string[] = (userMsg?.parts ?? [])
                .filter((p: any) => p.type === "file" && p.mediaType?.startsWith?.("image/") && p.filename)
                .map((p: any) => p.filename as string);

              if (userText) {
                await supabase.from("messages").insert({
                  conversation_id: body.conversationId,
                  role: "user",
                  content: userText,
                  image_paths: userImagePaths.length ? userImagePaths : null,
                });
              } else if (userImagePaths.length) {
                await supabase.from("messages").insert({
                  conversation_id: body.conversationId,
                  role: "user",
                  content: "",
                  image_paths: userImagePaths,
                });
              }

              // Strip the auto_log block from persisted content; the client
              // parses it separately to create the entry (with today's date)
              // and renders a chip. The block must never be shown to users.
              const cleanedAssistantText = assistantText
                .replace(/<auto_log>[\s\S]*?<\/auto_log>/g, "")
                .trim();

              if (cleanedAssistantText) {
                await supabase.from("messages").insert({
                  conversation_id: body.conversationId,
                  role: "assistant",
                  content: cleanedAssistantText,
                });

                // Auto-title from first user message (50 chars), if still default
                const { data: convo } = await supabase
                  .from("conversations")
                  .select("title")
                  .eq("id", body.conversationId)
                  .single();
                const currentTitle = (convo?.title ?? "").trim();
                const isDefault = !currentTitle || currentTitle === "New conversation";
                const newTitle = isDefault && userText
                  ? userText.replace(/\s+/g, " ").trim().slice(0, 50)
                  : null;
                await supabase
                  .from("conversations")
                  .update({
                    updated_at: new Date().toISOString(),
                    ...(newTitle ? { title: newTitle } : {}),
                  })
                  .eq("id", body.conversationId);
              }
            } catch (err) {
              console.error("Failed to persist chat messages:", err);
            }
          },
        });

        return response;
      },
    },
  },
});

// Component is unused for an API-only route, but TanStack expects one.
export const RouteComponent = () => null;