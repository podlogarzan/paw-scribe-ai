import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Heart, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { AppHeader } from "@/components/app/AppHeader";
import { BottomTabBar } from "@/components/app/BottomTabBar";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { getMessages } from "@/lib/conversations.functions";
import { useActivePet } from "@/stores/active-pet";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThreadPage,
});

function ChatThreadPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchMessages = useServerFn(getMessages);
  const activePetId = useActivePet((s) => s.activePetId);
  const [input, setInput] = useState("");

  const msgsQ = useQuery({
    queryKey: ["messages", threadId],
    queryFn: () => fetchMessages({ data: { conversationId: threadId } }),
  });

  const initialMessages: UIMessage[] = useMemo(
    () =>
      (msgsQ.data ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: "text", text: m.content }],
      })) as UIMessage[],
    [msgsQ.data],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { conversationId: threadId, petId: activePetId },
      }),
    [threadId, activePetId],
  );

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (e) => toast.error(e.message || "Chat error"),
    onFinish: () => qc.invalidateQueries({ queryKey: ["entries"] }),
  });

  useEffect(() => {
    if (!activePetId) navigate({ to: "/home", replace: true });
  }, [activePetId, navigate]);

  const isLoading = status === "submitted" || status === "streaming";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <AppShell>
      <AppHeader title="AI companion" />

      <div className="flex items-start gap-2 border-b border-border bg-[color:var(--ai-soft)]/50 px-4 py-2 text-xs text-foreground">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--ai)]" />
        <p>
          I can help you think through your pet's health, but I'm not a vet. For emergencies, call your vet right away.
        </p>
      </div>

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--ai-soft)] text-[color:var(--ai)]">
                <Heart className="h-7 w-7" />
              </div>
              <h3 className="mt-3 text-base font-semibold">Ask me anything about your pet</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Try: "Luna threw up twice this morning" or "What's a normal weight for a 6-month-old border collie?"
              </p>
            </div>
          ) : null}

          {messages.map((m) => {
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            if (m.role === "user") {
              return (
                <Message key={m.id} from="user">
                  <MessageContent>{text}</MessageContent>
                </Message>
              );
            }
            return (
              <Message key={m.id} from="assistant">
                <MessageContent variant="flat">
                  <MessageResponse>{text}</MessageResponse>
                </MessageContent>
              </Message>
            );
          })}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <Message from="assistant">
              <MessageContent variant="flat">
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border bg-background px-3 py-2">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me what's going on…"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!input.trim()} />
          </PromptInputFooter>
        </PromptInput>
      </div>

      <BottomTabBar />
    </AppShell>
  );
}