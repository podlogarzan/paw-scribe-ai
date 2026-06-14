import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage, type FileUIPart } from "ai";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { History, ImagePlus, PawPrint, Plus, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
import {
  createConversation,
  deleteConversation,
  getMessages,
  listConversations,
  createAiEntryFromAutolog,
  undoAiEntry,
} from "@/lib/conversations.functions";
import { uploadChatImage } from "@/lib/chat-images.functions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useActivePet } from "@/stores/active-pet";
import { toast } from "sonner";
import { useIsDesktop } from "@/hooks/use-breakpoint";

function PawAvatar({ size = 28 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-[#7BAF89] text-white"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <PawPrint className="h-3.5 w-3.5" />
    </div>
  );
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThreadPage,
});

function ChatThreadPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isDesktop = useIsDesktop();
  const fetchMessages = useServerFn(getMessages);
  const fetchConversations = useServerFn(listConversations);
  const createConv = useServerFn(createConversation);
  const deleteConv = useServerFn(deleteConversation);
  const uploadImage = useServerFn(uploadChatImage);
  const createAiEntry = useServerFn(createAiEntryFromAutolog);
  const undoEntry = useServerFn(undoAiEntry);
  const activePetId = useActivePet((s) => s.activePetId);
  const [input, setInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ id: string; file: File; previewUrl: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [entryByMessageId, setEntryByMessageId] = useState<
    Record<string, { id: string; title: string }>
  >({});
  const prevStatusRef = useRef<string>("ready");

  const msgsQ = useQuery({
    queryKey: ["messages", threadId],
    queryFn: () => fetchMessages({ data: { conversationId: threadId } }),
  });

  const convosQ = useQuery({
    queryKey: ["conversations", activePetId],
    queryFn: () => fetchConversations({ data: { petId: activePetId! } }),
    enabled: !!activePetId,
  });

  const initialMessages: UIMessage[] = useMemo(
    () =>
      (msgsQ.data ?? []).map((m) => {
        const parts: any[] = [];
        if (m.content) parts.push({ type: "text", text: m.content });
        for (const url of (m as any).image_urls ?? []) {
          parts.push({ type: "file", url, mediaType: "image/*" });
        }
        return { id: m.id, role: m.role, parts };
      }) as UIMessage[],
    [msgsQ.data],
  );

  // Seed entry chips from persisted messages
  useEffect(() => {
    if (!msgsQ.data) return;
    setEntryByMessageId((prev) => {
      const next = { ...prev };
      for (const m of msgsQ.data as any[]) {
        if (m.entry) next[m.id] = m.entry;
      }
      return next;
    });
  }, [msgsQ.data]);

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
    onFinish: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["conversations", activePetId] });
      qc.invalidateQueries({ queryKey: ["messages", threadId] });
    },
  });

  useEffect(() => {
    if (!activePetId) navigate({ to: "/home", replace: true });
  }, [activePetId, navigate]);

  const isLoading = status === "submitted" || status === "streaming";

  // When a stream finishes, parse <auto_log> from the last assistant message,
  // create an entry (with today's date), and remember it for the chip.
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (prev !== "streaming" || status === "streaming") return;
    if (!activePetId) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    const text = last.parts.map((p: any) => (p.type === "text" ? p.text : "")).join("");
    const match = text.match(/<auto_log>([\s\S]+?)<\/auto_log>/);
    if (!match) return;
    try {
      const json = JSON.parse(match[1]);
      if (!json?.type || !json?.title) return;
      const allowed = ["appointment", "vaccination", "health_issue", "note"] as const;
      if (!allowed.includes(json.type)) return;
      const messageId = last.id;
      createAiEntry({
        data: {
          conversationId: threadId,
          petId: activePetId,
          type: json.type,
          title: String(json.title).slice(0, 200),
          description: json.description ? String(json.description).slice(0, 4000) : null,
        },
      })
        .then((entry) => {
          setEntryByMessageId((prev) => ({ ...prev, [messageId]: entry }));
          qc.invalidateQueries({ queryKey: ["entries"], refetchType: "all" });
          toast.success(`Added to record: ${entry.title}`);
        })
        .catch((err: any) => {
          toast.error(err?.message || "Failed to log entry");
        });
    } catch {
      // ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleUndoEntry(messageId: string, entryId: string) {
    try {
      await undoEntry({ data: { entryId } });
      setEntryByMessageId((prev) => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["messages", threadId] });
      toast.success("Entry removed");
    } catch (e: any) {
      toast.error(e.message || "Undo failed");
    }
  }

  async function handleSubmit(message: PromptInputMessage) {
    const text = (message.text ?? input).trim();
    if ((!text && pendingFiles.length === 0) || isLoading || uploading) return;
    setUploading(true);
    try {
      const files: FileUIPart[] = [];
      for (const pf of pendingFiles) {
        const buf = await pf.file.arrayBuffer();
        const b64 = arrayBufferToBase64(buf);
        const res = await uploadImage({
          data: {
            conversationId: threadId,
            mediaType: pf.file.type || "image/jpeg",
            dataBase64: b64,
          },
        });
        files.push({
          type: "file",
          url: res.signedUrl,
          mediaType: res.mediaType,
          filename: res.path,
        });
      }
      sendMessage({ text: text || "(image)", files });
      setInput("");
      pendingFiles.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPendingFiles([]);
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onPickFiles(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));
    setPendingFiles((prev) => [...prev, ...next]);
  }

  function removePending(id: string) {
    setPendingFiles((prev) => {
      const removed = prev.find((p) => p.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function handleNewConversation() {
    if (!activePetId) return;
    try {
      const c = await createConv({ data: { petId: activePetId } });
      await qc.invalidateQueries({ queryKey: ["conversations", activePetId] });
      setHistoryOpen(false);
      navigate({ to: "/chat/$threadId", params: { threadId: c.id } });
    } catch (e: any) {
      toast.error(e.message || "Failed to create conversation");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this conversation?")) return;
    try {
      await deleteConv({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["conversations", activePetId] });
      if (id === threadId) {
        setHistoryOpen(false);
        navigate({ to: "/chat", replace: true });
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  const conversationList = (
    <ul className="space-y-1">
      {(convosQ.data ?? []).map((c) => {
        const isActive = c.id === threadId;
        return (
          <li
            key={c.id}
            className={`group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors ${
              isActive ? "bg-accent" : "hover:bg-accent/60"
            }`}
          >
            <button
              className="flex-1 min-w-0 text-left"
              onClick={() => {
                setHistoryOpen(false);
                navigate({ to: "/chat/$threadId", params: { threadId: c.id } });
              }}
            >
              <div className="truncate text-sm font-medium text-foreground">
                {c.title?.trim() || "New conversation"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
              </div>
            </button>
            <button
              aria-label="Delete conversation"
              className="rounded p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(c.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );

  const rightPanel = (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Conversations
        </h2>
        <Button onClick={handleNewConversation} className="mt-3 w-full justify-start gap-2" variant="secondary">
          <Plus className="h-4 w-4" /> New conversation
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {(convosQ.data ?? []).length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">No conversations yet.</p>
        ) : (
          conversationList
        )}
      </div>
    </div>
  );

  return (
    <AppShell rightPanel={rightPanel}>
      <AppHeader title="AI companion" />

      <div className="flex items-center gap-2 border-b border-[#F0F0F0] bg-[color:var(--ai-soft)] px-3 py-2 text-xs text-foreground">
        <Sheet open={historyOpen && !isDesktop} onOpenChange={setHistoryOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-[color:var(--warm)] lg:hidden" aria-label="Conversation history">
              <History className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-[88%] max-w-sm flex-col p-0">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle>Conversations</SheetTitle>
            </SheetHeader>
            <div className="border-b border-border p-3">
              <Button onClick={handleNewConversation} className="w-full justify-start gap-2" variant="secondary">
                <Plus className="h-4 w-4" /> New conversation
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {(convosQ.data ?? []).length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">No conversations yet.</p>
              ) : (
                conversationList
              )}
            </div>
          </SheetContent>
        </Sheet>
        <p className="flex-1 text-[color:var(--foreground)]/80">
          Vetyco AI is not a veterinarian. For emergencies, call your vet.
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-[color:var(--warm)]"
          aria-label="New conversation"
          onClick={handleNewConversation}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <PawAvatar size={36} />
              <h3 className="mt-3 text-sm font-semibold">Ask me anything about your pet</h3>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Try: "Luna threw up twice this morning" or "What's a normal weight for a 6-month-old border collie?"
              </p>
            </div>
          ) : null}

          {messages.map((m) => {
            const rawText = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            const text = rawText.replace(/<auto_log>[\s\S]*?<\/auto_log>/g, "").trim();
            const images = m.parts.filter((p: any) => p.type === "file" && (p.mediaType?.startsWith?.("image/") || true) && p.url) as any[];
            if (m.role === "user") {
              return (
              <Message key={m.id} from="user">
                <MessageContent className="!rounded-[20px] !bg-primary !text-primary-foreground">
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {images.map((p, i) => (
                        <img
                          key={i}
                          src={p.url}
                          alt=""
                          className="h-32 w-full rounded-2xl object-cover"
                        />
                      ))}
                    </div>
                  )}
                  {text && text !== "(image)" ? <span>{text}</span> : null}
                </MessageContent>
              </Message>
              );
            }
            const entry = entryByMessageId[m.id];
            return (
              <Message key={m.id} from="assistant" className="!flex-row !items-start gap-2">
                <PawAvatar size={28} />
                <MessageContent className="!bg-transparent !p-0 flex-1">
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {images.map((p, i) => (
                        <img key={i} src={p.url} alt="" className="h-32 w-full rounded-2xl object-cover" />
                      ))}
                    </div>
                  )}
                  <MessageResponse>{text}</MessageResponse>
                  {entry && (
                    <div
                      className="mt-2 inline-flex items-center gap-3 self-start rounded-[20px] border-l-4 border-primary bg-white px-3 py-2 text-xs font-medium text-foreground"
                      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)" }}
                    >
                      <span>📅 Added to record: '{entry.title}'</span>
                      <button
                        type="button"
                        onClick={() => handleUndoEntry(m.id, entry.id)}
                        className="text-primary underline underline-offset-2 hover:no-underline"
                      >
                        Undo
                      </button>
                    </div>
                  )}
                </MessageContent>
              </Message>
            );
          })}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <Message from="assistant" className="!flex-row !items-start gap-2">
              <PawAvatar size={28} />
              <MessageContent className="!bg-transparent !p-0 flex-1">
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div
        className="px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+96px)] md:pb-3"
      >
        {pendingFiles.length > 0 && (
          <div className="mb-2 flex gap-2 overflow-x-auto">
            {pendingFiles.map((p) => (
              <div key={p.id} className="relative h-16 w-16 shrink-0">
                <img src={p.previewUrl} alt="" className="h-full w-full rounded-md object-cover" />
                <button
                  type="button"
                  onClick={() => removePending(p.id)}
                  className="absolute -right-1 -top-1 rounded-full bg-background p-0.5 shadow"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div
          className="rounded-[20px] bg-white [&_[data-slot=input-group]]:!border-0 [&_[data-slot=input-group]]:!shadow-none [&_[data-slot=input-group]]:!bg-transparent [&_[data-slot=input-group]]:!rounded-[20px]"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)" }}
        >
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me what's going on…"
          />
          <PromptInputFooter className="justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Attach photo"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                onPickFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <PromptInputSubmit status={status} disabled={(!input.trim() && pendingFiles.length === 0) || uploading} />
          </PromptInputFooter>
        </PromptInput>
        </div>
      </div>

      <BottomTabBar />
    </AppShell>
  );
}