---
name: Ministros FC
description: A black-and-white team sheet in Spanish, ruled in hard black, with one blue for details and a typewriter voice.
colors:
  ink: "#0b0b12"
  ink-soft: "#2b2e3b"
  paper: "#fbfbfc"
  ground: "#e4e5ea"
  rule: "rgba(11, 11, 18, 0.22)"
  detail-blue: "#2748d6"
  detail-blue-on-ink: "#8ea6ff"
typography:
  display:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "clamp(3rem, 15vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "0em"
  headline:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "0em"
  title:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.45
  body:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.45
    letterSpacing: "0.12em"
rounded:
  none: "0px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  sheet-paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "24px 16px 32px"
  strip-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "16px"
  strip-ink-hover:
    backgroundColor: "{colors.ink-soft}"
  strip-paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "16px"
  strip-paper-hover:
    backgroundColor: "{colors.ground}"
  cta-slot-button:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "14px 16px"
  position-tag:
    textColor: "{colors.detail-blue}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 6px"
  stamp:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.detail-blue}"
    typography: "{typography.display}"
    rounded: "{rounded.none}"
    padding: "4px 16px"
  crest:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    size: "36px"
---

# Design System: Ministros FC

## Overview

**Creative North Star: "Planilla en Triplicado"**

The public home is one team sheet for the next game, printed in black ink on a white sheet with hard black rules. Black and white carry the page; a single blue marks details and nothing else. The sheet reads like a form filled in on a typewriter: heavy condensed capitals for names and headings, a monospaced typewriter face for everything written on the lines.

The system is flat and ruled. There are no cards, no radii, no soft shadows; structure comes from 3px black rules, hairline rules between lines, and full-bleed black and white strips. Density is that of a form: numbered lines, tabular figures, generous 44-48px tap rows. Copy is Spanish.

Migration status, stated honestly: only the public home (`src/pages/index.vue`) and the `sheet` layout have moved to this system. Other pages and the admin still use the earlier Nuxt UI look driven by `theme.css` and `app.config.ts` (brand #4f72e2 and related tokens), and those tokens stay in force there until each page migrates. The tokens below apply to the `.sheet-world` scope only.

**Key Characteristics:**
- Black ink on a white sheet, with a light gray ground (#e4e5ea) behind the sheets.
- One blue (#2748d6) for details only; on black it becomes a lighter blue (#8ea6ff).
- Hard 3px black rules frame each sheet; hairline rules separate lines.
- Square everywhere except the round crest.
- One authored motion moment: the stamp landing.
- Self-hosted type (Big Shoulders Display, Courier Prime), no external font requests.

## Colors

A strict black-and-white palette with a single blue reserved for details.

### Primary
- **Detail Blue** (#2748d6): line numbers, labels and nav labels, position tags, link underlines, arrows on white, the SUSPENDIDO stamp, the state word in the strip, focus rings, text selection, and the reserved-slot dashed outline.
- **Detail Blue on Ink** (#8ea6ff): the same role on black surfaces only (strip arrow, footer year, focus ring inside black strips).

### Neutral
- **Sheet Ink** (#0b0b12): all text, the crest, the black strip, the footer, and every 3px rule.
- **Soft Ink** (#2b2e3b): hover fill on black strips and the reserved button; secondary meta text on results.
- **Sheet White** (#fbfbfc): the sheet itself and text on black.
- **Sheet Ground** (#e4e5ea): page background behind the sheets and the hover fill on white lines and strips.
- **Line Rule** (rgba(11,11,18,0.22)): hairline separators between numbered lines and results.

### Named Rules
**The One Blue Rule.** Blue is for details: numbers, labels, tags, links, arrows, the stamp, the reserved slot. It never fills a surface, never becomes a button, and never appears as a large area. Black and white are the main colors.

**The On-Ink Blue Rule.** On black, details use #8ea6ff; #2748d6 is for white only.

## Typography

**Display Font:** Big Shoulders Display (with Arial Narrow, sans-serif)
**Body Font:** Courier Prime (with Courier New, monospace)

**Character:** A heavy condensed poster face set against a typewriter. The display speaks the names and numbers; the typewriter fills in the lines.

### Hierarchy
- **Display** (800, clamp(3rem, 15vw, 6rem), 0.92): the rival name in the page h1, uppercase, balanced wrap.
- **Headline** (800, 1.875-2.25rem, 0.92): section headings (Convocados, Resultados, Goleadores) and the black and white copy strips (1.875rem); also scores at 2.25rem.
- **Title** (700, 1.125rem, 1.45): player names on convocado lines.
- **Body** (400, 0.9375rem, 1.45): the typewriter default for lines, meta and empty states; prose capped with `max-w-prose`.
- **Label** (700, 0.75rem, 0.12em, uppercase): header navigation labels, blue.

### Named Rules
**The Tabular Rule.** Every number (shirt numbers, dates, times, scores, ranks) uses tabular figures so columns align like a form.

**The Caps Rule.** Display type is always uppercase with zero letter-spacing; only the label uses tracking.

## Layout

A single centered column, max width 768px (`max-w-3xl`), 16px side gutter, designed phone first at 390px. Sheets stack vertically: header, next-game sheet, black and white copy strips, results and scorers sheet, black footer. Results and scorers sit side by side from the `md` breakpoint with a 40px gap and stack below it. Spacing rhythm observed: 8, 12, 16, 24, 40px. Tap rows are 44px minimum for links and 48px for lines, 56px for result rows. The header nav scrolls horizontally rather than wrapping.

## Elevation & Depth

Flat. Depth is conveyed by rules, full-bleed black strips, and the step from white sheet to gray ground, never by shadows. The only inset rings are the two thin rings inside the crest, which are drawn with inset box-shadow to read as a printed stamp border.

### Named Rules
**The Ruled Depth Rule.** A surface is separated by a 3px ink rule or a hairline rule. No drop shadows, glows, or blurs.

## Shapes

Square corners throughout (0px). The one circle is the crest: a black disc with a white double ring and a condensed "M" monogram, a placeholder for the club crest. Borders are 3px ink for sheet edges and the stamp (6px), 1px blue for position tags, 3px dashed blue for the reserved slot. Arrows are 24-unit square-capped strokes at 3px, inheriting the surrounding color.

## Components

### Header and Crest
A white sheet with a 3px ink bottom rule. Crest (36px black circle, white "M") and wordmark "Ministros FC" in display type at left; Ingresar or the profile menu at right; four blue uppercase labels below (Inicio, Plantilla, Calendario, Estadísticas), where the active one turns ink and underlined. Hover underlines. A skip link to the content is the first element.

### Next-Game Sheet
The rival name in display type as the h1 ("vs {rival}"), then a ruled strip (3px ink rule above and below) holding state (Próximo, En juego, Anulado, in blue), date, time, and venue in bold uppercase tabular text. "Cómo llegar" is a bold underlined link with an arrow. No kicker precedes the heading.

### Convocados Lines
A numbered list: blue shirt number in a fixed 32px column, name in bold 18px, an optional blue-bordered position tag at right. Lines are separated by hairline rules and are links to the player; hover fills with ground. Guests appear as "Invitado de {name}" with a blue dash instead of a number and are not links. Empty state is a plain sentence between rules.

### Game Sheet, Detail Mode

The game detail page reuses the Next-Game Sheet and adds, on completed games: a state cell reading Jugado, a competition cell (Liga, Copa…), the score in display numerals up to 9rem with the result word beneath in blue (Victoria, Empate, Derrota), a "Jugaron" heading with the count out of the maximum, and per-player ink-bordered tags for goals (G), assists (A), yellow cards (a yellow square) and red cards (a red square), only the non-zero ones, each with a `title` naming it and a one-line legend under the list. Yellow (#f5c400) and red (#d62020) are the colors of real cards and the one sanctioned exception to the single blue; they appear only as these small squares. A game with no recorded score states that plainly and never shows 0 – 0. A "← Calendario" link sits above the heading, and there is no signup call to action.

### Schedule Sections

The schedule opens on "Todos": two sections, Próximos partidos then Partidos jugados, each headed by a full-width ink band with the title in display caps in paper color and its game count in blue-on-ink, so the next and previous games are divided at a glance. Three chips (Todos, Próximos, Resultados) filter the view down to one section; the rival filter applies to both. Both halves load once and the chips only change what is shown.

### Game Line and Month Sections

The schedule groups games under display-caps month headings, each over a 3px ink rule. A game line (minimum 72px, one tap target) has a three-part grid: a day tile with a blue uppercase weekday over a display day numeral, the rival in display caps with a typewriter time and venue beneath, and on the right either the score in display numerals with a blue result word (Victoria, Empate, Derrota, or "Sin dato" with a dash when no score is recorded), a blue arrow for upcoming games, or the word Anulado with the rival struck through for called-off games that have not happened yet (the Próximos view also fetches those). The Victoria result word is set inverted (paper on ink); Empate and Derrota stay plain blue. Upcoming games sort soonest first and results newest first, capped at 50 with a note.

### Strips (Plantilla and Estadísticas)
Two full-bleed rows of display type with an arrow: Plantilla in white on black (arrow in on-ink blue), Estadísticas in ink on white (arrow in blue) closed by a 3px rule. Hover shifts black to soft ink and white to ground.

### Results and Scorers
Two ruled lists under a 3px ink rule. Results show the score in display type, the rival in bold, outcome and date in soft ink. Scorers show a two-digit blue rank, name, and goal count in display type. Each ends with a bold underlined link with an arrow.

### Stamp (SUSPENDIDO)
When a game is cancelled, a blue-bordered (6px), white-backed, rotated (-8deg) display-type stamp lands over the convocados and their names are struck through in blue (3px). It is the one authored motion: 420ms with an overshooting ease (cubic-bezier(0.16, 1, 0.3, 1)), scaling from 1.5 to 1, disabled under reduced motion. A cancelled game is sealed and struck, never greyed.

### Reserved Signup Slot
A dashed blue 3px rule above a full-width black display-type button ("Anotarme"). It is mounted only when the runtime flag `signupCtaEnabled` is true and the game is not cancelled; it is hidden in production and sits in the line after the last convocado so enabling it moves nothing else.

### Player Ficha

A portrait card for one player: 3px ink border, square corners, paper ground. Top: the photo in grayscale with a contrast lift (color returns on hover or focus), with the dorsal in blue display type inside a paper tab pinned to the top-left corner. With no real photo (the seeded generic avatar counts as none) the picture area becomes a ground-gray field with the dorsal, or the player's initials, set huge in ink. Below a 3px rule: the nickname as a blue label in quotes, the surname in display caps, the first name in typewriter, and a blue position tag. At the foot, a ruled three-cell strip (PJ, G, A) in display numerals; a missing value reads as an em dash. Only real data appears: no ratings, flags or abilities, and the strip can take more cells later. When a player has a real photo and a dorsal, the large (profile) ficha splits its picture in two: the grayscale portrait on the left and a full-height ink plate on the right (36% wide, left rule) carrying a blue-on-ink Nº label and the dorsal in huge paper-colored display numerals, so the number is never reduced to a tab. In the grid size the dorsal rides on a small paper tab at the portrait's top-left corner. Grid size sits two to a row on phones, three from `sm`, four from `lg`; the large size is used on the profile and is not a link.

### Form Fields

Search and selects are 3px ink-bordered, square, paper-filled boxes with 44px minimum height and a blue typewriter label above (`sheet-field`). Focus uses the world's 3px blue outline with 3px offset.

### Ranked Rows

Every statistics table is a list of ruled rows under a 3px ink rule on a paper ground, capped at 768px for reading. Each row (minimum 56px, one tap target) carries a blue rank, the surname or label in display caps, a small typewriter subtitle (first name, position, period, venue), and ONE headline numeral in display type with a blue unit label and a bar beneath it scaled to the leader. Tapping a row opens a four-column ruled grid with the remaining stats and a blue underlined link to the ficha or history. Rank is hidden when the list is in its natural order (years, tournaments). Negative values show their sign and no bar.

### Sort Chips

3px ink-bordered square chips under a blue "Ordenar por" label, 44px minimum height. The pressed chip inverts to ink with paper text (`aria-pressed`). They choose what the headline numeral and bar mean; a leading "Orden" chip restores the natural order where one exists.

### Section Tabs and Filter Bar

The statistics section sits under the header as a row of blue uppercase tabs (General, Goleadores, and, when signed in, Jugadores, Rivales, Año, Torneo). The active tab turns ink with a 4px blue underline. Tabs wrap to a second line instead of scrolling. Filters live in a ruled bar between two 3px ink rules in a one-column phone grid; Nuxt UI selects inside it are restyled to the same 3px ink, square, paper-filled field.

### Focus and Selection
Focus-visible is a 3px blue outline with 3px offset (on-ink blue inside black strips). Text selection is blue on white.

## Do's and Don'ts

### Do:
- **Do** keep black and white as the main colors and use blue (#2748d6) only for details.
- **Do** use #8ea6ff for blue on black surfaces.
- **Do** separate content with 3px ink rules and hairline rules (rgba(11,11,18,0.22)).
- **Do** set display type in uppercase Big Shoulders Display and everything written on the lines in Courier Prime.
- **Do** use tabular figures for every number.
- **Do** keep tap targets at 44px or more and underline links with 2px blue.
- **Do** respect reduced motion by removing the stamp animation.

### Don't:
- **Don't** fill surfaces or buttons with blue.
- **Don't** round corners or add shadows; the crest is the only circle.
- **Don't** use a signup call to action on the home until the club adopts it; the reserved slot stays hidden.
- **Don't** apply this system to the admin or the other pages until they are migrated; they still use the Nuxt UI theme tokens.

Not canonized: none observed in the home that the craft floor bans.
