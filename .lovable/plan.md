## Goal
Replace the placeholder "v" logo with the two attached SVGs and update the splash screen with a horizontal-unfold wordmark animation. No backend changes.

## Steps

### 1. Upload SVGs as CDN assets
Use `lovable-assets create` on both uploaded files to produce:
- `src/assets/vetyco-icon-black.svg.asset.json`
- `src/assets/vetyco-wordmark-white.svg.asset.json`

### 2. Update `src/components/app/Logo.tsx`
Replace the rendered "v" character in `LogoMark` with an `<img>` of the black icon asset on a transparent background (drop the green tile background — the icon SVG already has its own black rounded-square shape). `LogoWordmark` stays unused for now (splash uses the white wordmark directly).

Affected call sites of `LogoMark` (unchanged behavior, just new visual):
- `src/components/app/SideNav.tsx` — desktop sidebar header (expanded + collapsed)

### 3. Update `src/components/app/AppHeader.tsx`
The mobile header currently shows the user's first initial in a green circle. Per the request, the avatar circle should use the black icon on a light background. Swap the initial for the black-icon SVG inside a white/neutral circle.

### 4. Rebuild splash in `src/routes/index.tsx`
Keep all existing logic (anonymous sign-in, `listPets`, navigation to `/chat` or `/onboarding`). Only change the visual + timing:
- Background: `#7BAF89` (unchanged)
- Center the white wordmark SVG
- Animation: horizontal unfold via `clip-path: inset(0 50% 0 50%)` → `inset(0 0 0 0)`, combined with `opacity 0 → 1`, 650ms, `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out, no bounce)
- After reveal completes, hold 400ms
- Then fade out (300ms) and navigate
- Pet-fetch work runs in parallel; navigation waits for both the data and the reveal+hold timeline (≈1.05s minimum, ≤1.5s total)

### Technical notes
- Import asset JSON: `import wordmark from "@/assets/vetyco-wordmark-white.svg.asset.json"` then `<img src={wordmark.url} />`.
- Keyframes defined inline in a `<style>` tag (matches current pattern in `index.tsx`).
- No changes to routes, server functions, stores, or Supabase wiring.

### Files touched
- new: `src/assets/vetyco-icon-black.svg.asset.json`
- new: `src/assets/vetyco-wordmark-white.svg.asset.json`
- edit: `src/components/app/Logo.tsx`
- edit: `src/components/app/AppHeader.tsx`
- edit: `src/routes/index.tsx`
