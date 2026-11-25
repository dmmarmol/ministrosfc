---
name: Ministros FC
description: A calm, light, card-based club site in Spanish: blue brand, near-black chrome, soft white cards that lift on hover.
colors:
  brand: "#4f72e2"
  ink-black: "#0c0908"
  sky-wash: "#dfeef7"
  canvas: "#f7f8fa"
  ink: "#111827"
  slate: "#4b5563"
  chrome-dark: "#111827"
  card-white: "#ffffff"
  hairline: "#f3f4f6"
  mute-text: "#6b7280"
  success: "#4bb543"
  info: "#2563eb"
  warning: "#fca307"
  error: "#f50013"
typography:
  display:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
rounded:
  md: "6px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.card-white}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
  card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  badge-status:
    backgroundColor: "{colors.sky-wash}"
    textColor: "{colors.info}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  nav-bar:
    backgroundColor: "{colors.chrome-dark}"
    textColor: "{colors.card-white}"
    typography: "{typography.body}"
    height: "48px"
  site-header:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.card-white}"
    typography: "{typography.display}"
    padding: "20px 16px"
---

# Design System: Ministros FC

## Overview

**Creative North Star: "The Matchday Programme"**

Ministros FC is an amateur football club's public home: who plays, when, against whom, and how it went. The system reads like a matchday programme: a calm light canvas, plain information set in confident small type, and a single blue masthead carrying the club's name. Content is the point. Fixtures, rosters and statistics sit on white cards, and the chrome around them stays quiet and dark.

Density is moderate and practical. Cards are compact rows (a 48px crest or avatar, a name, a line of meta, a score or status on the right) that stack in a single column on mobile and a grid on wider screens. The same vocabulary carries into the admin panel, where a near-black sidebar frames light working surfaces. Surfaces are flat at rest and answer interaction with a small lift. There is no decoration beyond the crest, the brand color, and numerals that carry the match result.

The brand is currently **blue**. The gold accent (`#d4af37`) from the club's earlier look survives only as a commented-out value in `theme.css`, a stale `tailwind.config.js` palette, and the dormant dark theme; treat it as legacy, not as a second accent.

**Key Characteristics:**
- Blue masthead, near-black nav and footer, light-gray canvas, white cards.
- Flat at rest; shadow appears only as a hover response.
- Soft geometry: 12px cards, 6px controls, fully round pills and avatars.
- Spanish-language copy; short labels, results spelled out (Victoria / Empate / Derrota).
- Built on Nuxt UI with Tailwind v4 tokens; semantic colors map to Nuxt UI color names.

## Colors

A single saturated blue on neutral grays, with the standard traffic-light semantic set for results and status.

### Primary
- **Club Blue** (`#4f72e2`): The brand and the `primary` token. Fills the site masthead and solid buttons; tints (10-15% alpha) form the soft/ghost/outline button states. Nuxt UI derives its hover as 75% opacity. Active nav links also use `brand` (`text-brand`) against the dark bar.

### Secondary
- **Ink Black** (`#0c0908`): The `secondary` token. Backs the admin sidebar (`--admin-ui-sidebar-bg`) and secondary buttons inside it.

### Tertiary
- **Sky Wash** (`#dfeef7`): The `tertiary` token, a pale blue tint for quiet highlights.

### Neutral
- **Canvas** (`#f7f8fa`): `--ui-bg`, the page background token. Layouts currently use Tailwind `gray-50` (public) and `gray-100` (admin) instead.
- **Ink** (`#111827`): `--ui-fg` and gray-900. Primary text, and the fill of the nav bar and footer.
- **Slate** (`#4b5563`): The `neutral` token; secondary text and neutral controls.
- **Mute Text** (`#6b7280`, `#9ca3af`): Meta lines (gray-500) and placeholders / inactive nav (gray-400).
- **Hairline** (`#f3f4f6`): Card border (gray-100) and avatar placeholder fill.
- **Card White** (`#ffffff`): Card surfaces.

### Semantic
- **Success** (`#4bb543`), **Info** (`#2563eb`), **Warning** (`#fca307`), **Error** (`#f50013`): Map to Nuxt UI badge/alert colors. Game status: scheduled = info, in progress = warning, completed = success, cancelled = error.

### Named Rules
**The One Blue Rule.** Blue is the only chromatic brand color. It marks the masthead, the primary action, and the active location, and nothing else. Do not introduce a second accent; gold is retired.

**The Result Color Rule.** Win, draw and loss are always green, amber and red, with a text label beside the color. Never carry meaning by color alone.

## Typography

**Display Font:** Satoshi (fallback `sans-serif`), declared as `--font-display` for headings.
**Body Font:** Inter (with `ui-sans-serif, system-ui, sans-serif`).

**Character:** One humanist sans family for everything; hierarchy comes from weight and size, not from a second voice. Neither face is self-hosted or imported in the repo today, so rendering falls back to the system sans unless Nuxt UI's font handling resolves them. Confirm this before relying on exact metrics.

### Hierarchy
- **Display** (700, 1.5rem, 1.25): The club name in the masthead. Page titles use the same weight.
- **Title** (600, 0.875rem, 1.43): Card headings: opponent name, player name. Truncate, never wrap.
- **Body** (400, 0.875rem, 1.43): Default UI text, table cells, buttons (500 in buttons).
- **Label** (600, 0.75rem, 1.33): Badges, result words, meta lines (regular weight, gray-500), small links.
- **Score** (700, 1.125rem, 1): Match scores such as `3 – 1`, set against a 0.75rem result label.

### Named Rules
**The Small and Sure Rule.** The default size is 14px. Type is small, dark and plain; emphasis is weight, never color tricks or decorative faces.

## Layout

A centered container (`max-w-7xl`, 1280px) with 16px side padding and 24px vertical padding for main content. Page structure is a vertical stack: masthead (about 88px), 48px dark nav bar, content, footer. The admin layout swaps this for a collapsible 256px sidebar and a white top bar over a `gray-100` main area with 24px padding.

Spacing follows Tailwind's 4px scale; the recurring values are 8, 12, 16 and 24px. Cards are rows with a 16px gap between crest, text and score. Breakpoints are Tailwind's: 640, 768, 1024, 1280, 1536, plus a custom 1920. The primary navigation collapses to a hamburger below `md` (768px) with a stacked menu on a lighter gray-800 panel.

## Elevation & Depth

Hybrid, leaning flat. Public surfaces rest on a hairline gray-100 border with `shadow-sm`; hover raises them to `shadow-md`. The masthead carries `shadow-md` to separate it from the nav. Tonal layering (blue masthead, near-black chrome, light canvas, white card) does most of the work; shadows are only a small cue.

### Shadow Vocabulary
- **Rest** (`box-shadow: var(--tw-shadow)` from `shadow-sm`): Cards at rest, with a 1px gray-100 border.
- **Lift** (`shadow-md`): Card hover, and the site masthead.

### Named Rules
**The Hover-Lift Rule.** Surfaces are flat at rest. Interactive cards gain one shadow step on hover (`transition-shadow`); photos may scale to 105% over 300ms. Nothing else moves.

## Shapes

Soft and consistent. Cards and containers use 12px corners (`rounded-xl`); controls and buttons use 6px (`rounded-md`); badges, jersey numbers, avatars and crests are fully round (`rounded-full`). Player cards are square-photo cards (`aspect-square`, `object-cover`) with the position label and jersey badge pinned top-left. Borders are hairline, one pixel, and only on cards. Focus uses a 2px outline or ring in the semantic color with a 2px offset.

## Components

### Buttons
Nuxt UI `UButton`, restyled in `app.config.ts`. Default is solid primary, size md.
- **Shape:** 6px corners (`rounded-md`), medium weight, inline-flex with icon gap 6px.
- **Primary (solid):** Club Blue fill, inverted (near-white) text, padding 6px 10px at md. Hover and active drop to 75% opacity.
- **Outline / Soft / Subtle / Ghost:** Primary tint at 10-25% alpha, primary text; hover raises to 10-15%.
- **Link:** Primary text, 75% on hover.
- **Neutral variants:** Use Nuxt UI's `default`, `elevated` and `accented` surface tokens.
- **Focus:** 2px primary outline with 2px offset (solid) or 2px ring (outline, subtle).
- **Disabled:** 75% opacity, `not-allowed` cursor. Buttons use `cursor-pointer`.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** White on a gray-50 canvas.
- **Shadow Strategy:** `shadow-sm` at rest, `shadow-md` on hover. See Elevation.
- **Border:** 1px gray-100.
- **Internal Padding:** 16px for row cards (game), 12px for the info block of photo cards (player).

### Game card
A single-row card: round 48px opponent crest (initials fallback in gray-400), "vs {team}" in title weight, date and venue in gray-500 xs, then on the right the score with a result word (completed), a status pill (scheduled/cancelled), or the signup CTA. The whole row links to the game.

### Player card
Square photo with hover zoom. Top-left stack: position label, then a brand-filled round jersey-number pill (`#12`) in dark text. Below: name (title weight, truncated) and optional italic nickname in gray-400.

### Badges / Pills
- **Style:** Fully round, 12px semibold, padding 2px 8px. Light tint background with a darker same-hue text (for example `bg-blue-100 text-blue-700`). Status uses Nuxt UI `UBadge` with semantic colors.

### Navigation
- **Bar:** 48px, gray-900, max-w-7xl, links at 14px medium in white; hover and active switch to brand blue. Right side holds the sign-in action (brand-filled, dark text, 12px) or the profile menu.
- **Mobile:** Hamburger below 768px; stacked links on gray-800.
- **Admin:** Collapsible icon sidebar on Ink Black with brand-colored wordmark; items are full-width secondary `UButton`s; footer holds profile, back-to-site and logout links.

### Masthead and footer
Masthead: solid brand blue, white text, a 48px translucent-white circle holding an "M" monogram, club name at 24px bold, and "Desde 2023" at 12px beneath. Footer: gray-900, gray-400 text at 14px, links brighten to white on hover.

## Do's and Don'ts

### Do:
- **Do** use `primary` / `brand` (`#4f72e2`) for the single main action and the active location on a screen.
- **Do** build new surfaces from the card recipe: white, `rounded-xl`, 1px gray-100 border, `shadow-sm`, `hover:shadow-md`.
- **Do** use Nuxt UI components (`UButton`, `UBadge`, `UInput`) with semantic color names before reaching for raw Tailwind colors.
- **Do** pair every result color with a word (Victoria, Empate, Derrota) and keep copy in Spanish.
- **Do** truncate names in single-line rows and keep meta text at 12px gray-500.

### Don't:
- **Don't** reintroduce gold or any second brand accent.
- **Don't** hard-code `blue-100/700`, `green-600`, `gray-*` pairs where a semantic token exists; the repo already mixes both and drift is the main risk.
- **Don't** add resting shadows heavier than `shadow-sm` or shadows on non-interactive surfaces.
- **Don't** use fully round shapes for containers or buttons; round is reserved for avatars, crests and pills.
- **Don't** add decorative type faces or gradients; hierarchy is weight and size.
