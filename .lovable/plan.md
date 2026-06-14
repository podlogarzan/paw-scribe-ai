
## Goal

Refresh the app's UI to match the reference (warm card-based layout, hero pet image card, horizontal pet chips, clean pet detail card with Age/Weight/About) while preserving all backend logic (Supabase, AI chat, auto-log, entries, messages, storage). Also trim dead/unused code.

## 1. Cleanup (no behavior change)

- Audit `src/components/app/` and `src/lib/` for unreferenced exports/files; remove anything not imported anywhere (candidates: `SideNav.tsx`, `Logo.tsx` if unused, stale helpers in `documents.functions.ts` if not wired). Verified by `rg` before deletion.
- Remove dead imports and `console.log` debug lines left over from the auto-log debugging session in `chat.$threadId.tsx`, `conversations.functions.ts`, `routes/api/chat.ts`.
- Drop the orphan `chat.tsx` shell if `chat.index.tsx` + `chat.$threadId.tsx` already cover routing.
- Keep all server functions, Supabase client files, routes used by features.

## 2. Home screen redesign (`src/routes/_authenticated/home.tsx`)

Replace the current calendar-first layout with a card-based home that mirrors the reference, while keeping the calendar reachable.

Layout (mobile-first, top to bottom):

```
┌──────────────────────────────┐
│  Good morning,               │  greeting + user name (left)
│  <User name>            🔔   │  bell icon (right) → /home calendar drawer
├──────────────────────────────┤
│  🔍  Search             ⚙    │  search input + filter chip (visual only first pass)
├──────────────────────────────┤
│ [🐶 Buddy] [🐱 Mia] [+ Add]  │  horizontal pet chips (active = #7BAF89 pill,
│                              │  inactive = white pill w/ small avatar)
├──────────────────────────────┤
│  ╔══════════════════════╗    │  hero stack: 3 stacked rounded cards,
│  ║   pet hero photo     ║    │  top card = active pet's avatar_url
│  ║   (rounded 28px)     ║    │  (fallback species emoji on tinted bg).
│  ║                  →   ║    │  Tap → /entry-style pet detail (section 3)
│  ╚══════════════════════╝    │
├──────────────────────────────┤
│  Upcoming                    │  same data as today, compact white soft-cards
└──────────────────────────────┘
              [dark pill nav]
```

Keep the existing calendar grid but move it behind a small "Calendar" link/button under Upcoming OR keep it as a secondary section below. The bottom pill nav (already implemented) navigates Home / Chat / Gallery.

Data wiring stays the same (`listPets`, `upcomingEntries`, `listEntriesForPet`, active pet store). FAB + NewEntryDialog stays.

## 3. Pet detail card (matches second reference)

New route `src/routes/_authenticated/pet.$petId.tsx`:

- Big rounded hero image (avatar_url or species emoji on tinted background), heart icon top-right.
- Two stat tiles: Age (computed from `birth_date`) and Weight (`weight_kg` + "Kg").
- About card: shows `notes`.
- Bottom action row: "Adoption"-style status pill (use species/breed text) + paw FAB + call + chat icons (chat → opens `/chat`).
- Tap hero → file picker → calls existing `uploadPetAvatar` server fn (base64) → invalidates `["pets"]`.

Opened from the home hero card and from the pet chips' long-press / chevron.

## 4. Pet chip strip component

New `src/components/app/PetChipStrip.tsx`:

- Horizontal scroll list of pets + trailing "+ Add" tile that opens the existing add-pet dialog (extract from `profile.tsx` into a reusable `AddPetDialog`).
- Active chip: `#7BAF89` bg, white text, small avatar; inactive: white pill, soft shadow.
- Selecting a chip updates `useActivePet`.

## 5. Header component refresh (`AppHeader.tsx`)

- Left: avatar (user) + "Good morning, <name>" (name from supabase session metadata, fallback to email handle).
- Right: bell icon (no-op for now, hooks into future notifications).
- Removes any settings/cog from the current header to match reference.

## 6. Visual tokens (`src/styles.css`)

- `--bg: #FAFAF8`, `--primary: #7BAF89`, ensure these already present (they are from prior turns) — keep.
- `.soft-card`: `border-radius: 20px`, shadow `0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04)`, bg white.
- Add `.hero-card` utility: 28px radius, larger shadow, aspect 4/5.
- Font: Inter via existing `<link>` in `__root.tsx` (verify, add if missing — no `@import` of font URL in CSS).

## 7. Onboarding

Light pass: keep existing logic, restyle to match new tokens (white card on `--bg`, primary pill button, species emoji grid). No new screens.

## 8. Don't change

- `src/integrations/supabase/*` (client/server/middleware/types).
- AI chat streaming, auto-log parsing & insert, message persistence.
- `entries.functions.ts`, `conversations.functions.ts`, `pets.functions.ts` schemas/handlers.
- Bottom pill nav (already shipped in `BottomTabBar.tsx`).
- Database schema; no new migrations needed.

## Technical notes

- Reuse existing `uploadPetAvatar` for the hero photo upload — convert file to base64 in browser, pass `{ petId, fileBase64, mimeType }`.
- Use `useQueryClient().invalidateQueries({ queryKey: ["pets"] })` after upload so chips + hero refresh.
- For Age calc: `differenceInYears(new Date(), parseISO(birth_date))` from `date-fns` (already a dep).
- New route file must be created before any `<Link to="/pet/$petId">` to satisfy TanStack type-safe routing.

## Files touched

Edit: `home.tsx`, `profile.tsx` (extract AddPetDialog), `AppHeader.tsx`, `onboarding.tsx`, `styles.css`, `chat.$threadId.tsx` (cleanup logs), `conversations.functions.ts` (cleanup logs), `routes/api/chat.ts` (cleanup logs).
Add: `pet.$petId.tsx`, `PetChipStrip.tsx`, `AddPetDialog.tsx`, `PetHeroCard.tsx`.
Delete (after rg confirms unused): possibly `SideNav.tsx`, unused helpers.
