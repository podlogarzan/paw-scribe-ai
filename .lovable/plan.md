## PetVet — build plan

A mobile-first pet health journal with a calm wellness aesthetic, an AI care companion, a calendar of health events, and document storage. Multi-pet, fully backed by Supabase (auth, Postgres, Storage).

### Stack & key technical choices

This project runs on Lovable's modern stack (TanStack Start + React + Tailwind + shadcn). A few choices differ from your brief and I want to confirm them before building:

1. **AI provider — Lovable AI Gateway instead of a raw Anthropic key.** Lovable's built-in AI gateway already proxies Claude (`anthropic/claude-sonnet-4-5` and similar) with streaming, image input, and billing through your workspace credits — no API key setup required. The system prompt, safety rules, `<auto_log>` parsing, and emergency override all stay exactly as you described. If you specifically need your own Anthropic billing, I can swap to a direct Anthropic key instead.
2. **Server boundary — TanStack server route, not a Supabase Edge Function.** On the modern stack, the recommended boundary for app-internal AI streaming is a TanStack server route (`/api/chat`). Same behavior (streaming, auto-log parsing, entry insert), just the correct runtime for this template. Schema, RLS, and storage buckets remain on Supabase exactly as specified.
3. **Threaded conversations per pet, database-persisted** — matches your spec (conversation history list, switch between past conversations). Each thread gets its own route (`/chat/$threadId`).

Everything else follows your brief literally.

### Design system

- Background `#FAFAF8`, primary `#4A7C59` (forest green), danger `#C0392B`, AI accent `#7B6CF6`
- DM Sans via Google Fonts (loaded in `__root.tsx`), heavier weight for pet names
- Soft shadows, generous rounded corners (`rounded-2xl`), mobile-first
- Tokens defined in `src/styles.css` (`oklch`), surfaced via Tailwind semantic classes
- Reusable: `BottomTabBar`, `AppHeader`, `PetAvatar`, `EntryDot`, `EntryCard`, `EmptyState`

### Routes (TanStack file-based)

Public:
- `/auth` — sign in / sign up / forgot password (Supabase email+password)
- `/auth/reset-password` — set new password after recovery link

Authenticated (under `src/routes/_authenticated/`):
- `/` — Calendar (primary)
- `/chat` — redirects to latest conversation or creates a new one
- `/chat/$threadId` — AI chat for active pet
- `/chat/history` — past conversations for active pet
- `/entries/$entryId` — full entry detail
- `/documents` — document grid
- `/profile` — pet profile + add/switch pet + danger zone
- `/settings` — account, change password, delete account
- `/onboarding` — first-pet flow (2 steps)

Bottom tab bar on Calendar and Chat. Header shows active pet's avatar + name (tap → profile menu), with a profile icon on the right that opens Pet Profile / Documents / Settings.

### Active pet selection

Multi-pet support via a small Zustand store + localStorage (`activePetId`). Header avatar lets you switch pets; the active pet drives Calendar, Chat, Documents.

### Supabase backend

Migrations create exactly the schema you specified:
- `pets`, `entries`, `entry_photos`, `documents`, `conversations`, `messages`
- RLS on all tables; helper SQL function `public.user_owns_pet(pet_id uuid)` (SECURITY DEFINER) to avoid recursive policies. Every table policy uses `user_owns_pet(pet_id)`; `messages`/`entry_photos` go through their parent.
- Required `GRANT SELECT, INSERT, UPDATE, DELETE … TO authenticated` on every table.
- Storage buckets: `pet-avatars`, `entry-photos`, `documents` — all private, accessed via 1h signed URLs from server functions.

### Server functions & route

- `src/lib/pets.functions.ts` — list/create/update/delete pets, switch active pet
- `src/lib/entries.functions.ts` — list entries (by month / upcoming / by day), get entry detail with signed photo URLs, create/update/delete entry, upload entry photos
- `src/lib/documents.functions.ts` — list/upload/delete documents, signed URLs
- `src/lib/conversations.functions.ts` — list conversations for pet, create, get messages, delete; undo last AI-created entry
- `src/lib/storage.functions.ts` — signed URL helpers
- `src/routes/api/chat.ts` — streaming AI chat route. Loads pet profile + last 90 days of entries + conversation history, calls Lovable AI Gateway with the Claude model and your exact system prompt, streams response, parses `<auto_log>` JSON, inserts entry, returns `created_entry_id` so the chat shows the violet auto-log chip.

All protected fns use `requireSupabaseAuth`. Admin client (`supabaseAdmin`) is only imported inside handlers when needed (e.g., storage cleanup on pet deletion).

### Key UI behaviors

- **Calendar**: month grid, day cells show colored dots per entry type; "Upcoming" horizontal pill strip above; tap day → bottom sheet (shadcn `Drawer`) listing entries; FAB opens "New Entry" dialog with type / title / datetime / description / photo upload.
- **Entry detail**: title, badge, datetime, description, photo gallery (signed URLs), Edit/Delete; if `created_by='ai'`, violet "Logged by AI" badge linking back to source conversation.
- **Chat**: AI Elements primitives (`Conversation`, `Message`, `MessageResponse`, `PromptInput`, `Shimmer`); persistent safety banner at top; photo attach (base64 to AI route, stored alongside message); inline violet auto-log chip with View/Undo (undo deletes the entry within session); conversation history accessible from header.
- **Onboarding**: two-step wizard, step 2 skippable; ends on Calendar with 3 dismissible tooltip hints.
- **Empty states**: exactly the copy you provided.
- **Documents**: grouped by kind, upload modal accepts image or PDF, lightbox/inline viewer.

### Tooling notes

- Install AI Elements (`conversation`, `message`, `prompt-input`, `shimmer`) and `react-markdown` for assistant rendering.
- `framer-motion` for the bottom sheet, FAB, and tooltip hint reveal.
- `date-fns` for calendar math.
- Shadcn `Dialog`, `Drawer`, `Calendar`, `Popover`, `Tabs`, `Form`, `Toast` (sonner).

### What I'm not building (per your spec)

Email/push notifications, OCR, sharing, monetization, native wrapper.

---

Two yes/no things before I start:

1. **OK to use Lovable AI Gateway** (Claude via your workspace credits, zero key setup) instead of asking you for an Anthropic API key?
2. **OK to use a TanStack server route** for the streaming chat instead of a Supabase Edge Function?

If both are yes, I'll enable Lovable Cloud, run the migrations, and build the app end-to-end. If you'd rather keep Anthropic direct and/or Edge Functions, tell me and I'll adjust.
