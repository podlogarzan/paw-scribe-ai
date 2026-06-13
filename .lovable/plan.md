## Goal

Persistent chat history with a slide-in sidebar of past conversations, opening latest by default, "New conversation" action, and auto-titled threads from the first user message. Auth stays off — server functions use the admin Supabase client (RLS bypassed) for dev.

## Backend

**`src/lib/conversations.functions.ts`** — drop `requireSupabaseAuth` middleware on all conversation/message server fns and swap to `supabaseAdmin` (loaded with `await import("@/integrations/supabase/client.server")` inside each handler). Specifically:
- `listConversations({ petId })` → admin select ordered by `updated_at desc`.
- `getOrCreateLatestConversation({ petId })` → admin: latest by pet, or insert new.
- `createConversation({ petId })` → admin insert.
- `getMessages({ conversationId })` → admin select ordered asc.
- `deleteConversation({ id })` → admin delete.
- Add `renameConversation({ id, title })` → admin update of `title` (used for auto-title).

**`src/routes/api/chat.ts`** — remove the auth-header-gated Supabase client; use `supabaseAdmin` directly inside `onFinish`. Persist user + assistant messages and update `conversations.updated_at` as today. Add auto-title: if the conversation's current `title` is null or equals "New conversation", set it to the first 50 chars of the first user message (single-line, trimmed) via an update in the same `onFinish`.

## Routing / data flow

- Keep `/_authenticated/chat` → `/_authenticated/chat/$threadId` redirect via `getOrCreateLatestConversation` (already there). This satisfies "open latest by default".
- Keep `chat.$threadId.tsx` loading messages via `getMessages` for that thread (already there). Reload of `/chat/<id>` continues to restore that thread.

## UI changes in `src/routes/_authenticated/chat.$threadId.tsx`

Add a history sidebar:
- New header-left button (MessageSquare/History icon) in `AppHeader` slot opens a `Sheet` (shadcn) sliding in from the left.
- Sheet content: "New conversation" button at top, then list of conversations for the active pet (from `listConversations`), each row showing title (fallback "New conversation") and a relative date (`date-fns` `formatDistanceToNow`).
- Click a row → `navigate({ to: "/chat/$threadId", params: { threadId: id } })` and close sheet.
- "New conversation" → call `createConversation({ petId })`, navigate to the new thread, invalidate `["conversations", petId]`, close sheet.
- Active thread row is visually highlighted.
- Long-press / trailing trash icon → `deleteConversation` with confirm; if the deleted thread was active, redirect to `/chat` (which auto-creates / opens latest).

After the assistant stream completes (existing `onFinish` on `useChat`), invalidate the conversations list and the current thread's `["messages", threadId]` query so the new title and message rows refresh.

## Auto-title detail

Server-side (in `api/chat.ts onFinish`) is the source of truth: derive `title = userText.replace(/\s+/g, " ").trim().slice(0, 50)` and only write if title is null/empty/"New conversation". This guarantees titles persist even if the client refreshes mid-stream.

## Files touched

- `src/lib/conversations.functions.ts` — rewrite handlers to use admin client, add `renameConversation`.
- `src/routes/api/chat.ts` — swap to admin client; add auto-title update.
- `src/routes/_authenticated/chat.$threadId.tsx` — add history `Sheet`, new-chat button, query invalidations.
- (No DB migration — schema already has all needed columns.)

## Verification

1. Open `/chat` → redirects to a thread; send a message; refresh — messages and auto-title remain.
2. Click history icon → see thread list. Click "New conversation" → lands on a fresh empty thread.
3. Send a different first message → after stream completes, the sidebar list shows the new auto-title.
4. Switching between threads loads each one's own messages without bleed.
