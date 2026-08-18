---
name: Simon van Lierde — Engineering Drawing Set
description: A personal site drawn as one ISO technical drawing set — exploded view, balloons, bill of materials, title block.
colors:
  drafting-paper: "light-dark(oklch(97.5% 0.005 95), oklch(27% 0.05 262))"
  sheet-surface: "light-dark(oklch(99.2% 0.003 95), oklch(30.5% 0.055 262))"
  working-ink: "light-dark(oklch(23% 0.015 255), oklch(96.5% 0.008 240))"
  faded-ink: "light-dark(oklch(43% 0.02 255), oklch(85% 0.03 240))"
  hairline: "light-dark(oklch(80% 0.012 255), oklch(45% 0.05 258))"
  frame-line: "light-dark(oklch(32% 0.02 255), oklch(90% 0.02 240))"
  engineers-blue: "light-dark(oklch(42% 0.13 262), oklch(88% 0.055 225))"
  engineers-blue-deep: "light-dark(oklch(34% 0.11 262), oklch(94% 0.035 225))"
  on-accent: "light-dark(oklch(98% 0.003 95), oklch(25% 0.05 262))"
  checkers-red: "light-dark(oklch(47% 0.15 25), oklch(82% 0.1 25))"
  on-stamp: "light-dark(oklch(98.5% 0.003 95), oklch(23% 0.05 262))"
  chart-bar: "light-dark(oklch(42% 0.13 262), oklch(80% 0.07 225))"
  chart-bar-strong: "light-dark(oklch(34% 0.11 262), oklch(88% 0.055 225))"
typography:
  display:
    fontFamily: "osifont, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 1.6rem + 2.4vw, 3.4rem)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "0.02em"
  headline:
    fontFamily: "osifont, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.2rem, 1.1rem + 0.5vw, 1.45rem)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "0.14em"
  title:
    fontFamily: "osifont, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.2rem, 1.1rem + 0.5vw, 1.45rem)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "0.02em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(1rem, 0.96rem + 0.2vw, 1.1rem)"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "osifont, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(0.83rem, 0.8rem + 0.15vw, 0.9rem)"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  none: "0px"
  balloon: "50%"
spacing:
  2xs: "0.25rem"
  xs: "0.5rem"
  s: "0.75rem"
  m: "1.25rem"
  l: "2rem"
  xl: "3.5rem"
components:
  stamp:
    textColor: "{colors.checkers-red}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.75rem 1.25rem"
  stamp-hover:
    backgroundColor: "{colors.checkers-red}"
    textColor: "{colors.on-stamp}"
  balloon:
    backgroundColor: "{colors.drafting-paper}"
    textColor: "{colors.working-ink}"
    rounded: "{rounded.balloon}"
    width: "1.7rem"
    height: "1.7rem"
  datum:
    backgroundColor: "{colors.drafting-paper}"
    textColor: "{colors.working-ink}"
    rounded: "{rounded.none}"
    width: "1.7rem"
    height: "1.7rem"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.faded-ink}"
    rounded: "{rounded.none}"
    padding: "0.1em 0.55em"
---

## Design System: The Engineering Drawing Set

### Overview

**Creative North Star: "The Engineering Drawing Set"**

The site is one engineering drawing set. Taking products apart is what the
author does, so the page is drawn the way a product is drawn: an exploded view
with lettered notes, a bill of materials with position balloons, an ISO 7200
title block, a trim frame with centring ticks around every sheet. The refused
alternative is the minimal developer-portfolio text column: this site is a
measured drawing of the work, not an essay about it.

One world, two renderings of the same sheet. Light mode is ink linework on
warm drafting paper; dark mode is the same sheet printed as a cyanotype —
pale lines on a Prussian-blue ground, roles swapped, nothing redesigned.
Display, labels, and every number are set in osifont, the ISO 3098 technical
lettering face (vendored, latin-subset, ~10KB); long prose stays on the system
sans so text reads as text, not as a costume. Colour is never the sole signal.

Every figure is real and dated: the exploded kettle carries the Reverse
Engineering Lab's actual running counts, the title block carries the real
package version and export dates. Nothing decorative, nothing invented.

**Key Characteristics:**

- Ink-on-paper light theme, cyanotype-blueprint dark theme; one `light-dark()` pair per token
- osifont ISO 3098 drafting lettering for display, labels, and all data figures
- Hairline rules and zero radii everywhere; the only circle is the BOM position balloon
- Exactly one checker's-red stamp (primary action) per sheet
- A drawn sheet frame with centring ticks around the whole document
- Motion is drafting behaviour only: the exploded view settles apart once on load

### Colors

Two grounds, one working ink, engineer's blue for the working accents, and
checker's red for the single stamp; every pair is one `light-dark()` OKLCH
token, and every text pair clears 4.5:1 on its ground (verified at build
time). The frontmatter values are the normative source, mirrored from
`src/styles/global.css`.

#### Primary

- **Engineer's Blue** (`--accent`): links and working accents — the colour an
  engineer annotates in. On the blueprint side it becomes a pale drafting
  cyan, because the ground already owns the blue. `--accent-strong` is the
  hover step; `--accent-contrast` is the text colour on a filled accent
  surface (selected chart toggle, skip link, ::selection).

#### Secondary

- **Checker's Red** (`--stamp`): the approval-stamp colour, reserved for the
  one primary action per sheet (mailto on Sheet 1, the CV stamp elsewhere).
  Outlined at rest, filled on hover with `--stamp-contrast` text.

#### Neutral

- **Drafting Paper** (`--bg`): the page ground. Warm near-white paper in
  light; deep Prussian blue in dark, where it is the cyanotype ground.
- **Sheet Surface** (`--surface`): the one raised tint — BOM row hover and
  the chart control fieldset. Barely lighter than the ground.
- **Working Ink** (`--text`): near-black blue ink for text and part linework;
  near-white on the blueprint.
- **Faded Ink** (`--text-muted`): secondary text, fine linework, figure
  labels, chart axes.
- **Hairline** (`--border`) and **Frame Line** (`--border-strong`): the two
  rule weights. Hairline separates rows and cells; the strong line draws the
  sheet frame, section-heading rules, balloons, and datum marks.

#### Named Rules

**The One Stamp Rule.** Exactly one checker's-red stamp per sheet. Red exists
on a drawing to mark the checker's approval; a second red element on the same
sheet demotes both. Every other action is an engineer's-blue link.

**The Kept Names Rule.** The CSS custom property names (`--bg`, `--text`,
`--accent`, `--chart-bar`, ...) were deliberately kept from the previous
design system so every consumer — the React chart island included — rethemes
without edits. New surfaces consume tokens by these names; never fork a
parallel palette.

**The Uniform Chroma Rule.** Wide-gamut displays (`@media (color-gamut: p3)`)
lift only the chromatic tokens, uniformly (+~20% chroma), never lightness — a
display that claims P3 and clamps still clears every contrast floor.

### Typography

**Display Font:** osifont (with Segoe UI, system-ui fallback) — ISO 3098
technical lettering, vendored and subset (~10KB), weight 400 only
**Body Font:** system sans (ui-sans-serif stack)
**Label/Mono Font:** osifont — `--font-mono` aliases `--font-draft`

**Character:** The drafting hand carries everything a draughtsman would
letter: headings, labels, dates, dimensions, data. Prose stays on the system
sans so long text reads as text. The pairing is a working document's voice —
lettered where it is a drawing, typeset where it is reading matter.

#### Hierarchy

- **Display / h1** (400, `--step-3` = clamp(2.1–3.4rem), 1.12): the sheet's
  one title, uppercase, 0.02em tracking.
- **Headline / h2** (400, `--step-1` = clamp(1.2–1.45rem), 1.12): zone
  labels — smaller than the content they label, tracked caps (0.14em) over a
  2px `--border-strong` rule. A label, not a statement.
- **Title / h3** (400, `--step-1`, 1.12): part names in the BOM, 0.02em.
- **Body** (400, `--step-0` = clamp(1–1.1rem), 1.6): prose, max-width
  `--measure` (38rem).
- **Label** (400, `--step--1` = clamp(0.83–0.9rem), 0.04–0.14em tracking,
  usually uppercase): nav links, tags, title-block cells, periods, figure
  labels.

#### Named Rules

**The Drafting Hand Rule.** Figures and data — counts, dates, versions,
periods, chart numerals — are always set in osifont with
`font-variant-numeric: tabular-nums` (the `.draft`, `.tag`, and `time`
selectors). A number in the body face is prose; a number in the drafting hand
is data.

**The Measured Line Rule.** `--measure` is 38rem, deliberately in rem, not
`72ch`: `ch` measures the zero glyph and lands near 91 real characters in a
system sans; 38rem lands near 70. Cap prose in rem.

### Layout

The page is one tall sheet. The body carries `padding: calc(--frame-inset +
--frame-line)` and two pseudo-elements draw the trim frame: a 1.5px
`--border-strong` border on `body::before` (absolute on the **document**, not
viewport-fixed — a fixed line would strike through scrolling text) plus four
centring ticks at the edge midpoints on `body::after`. Screen only; print
gets the plain document. `--frame-inset` is clamp(8px, 1.2vw, 16px).

Inside the frame: `.container` is `min(100% - 2 * --space-m, 64rem)`,
centred. Sections stack with `padding-block: --space-xl` (3.5rem) and a
hairline top rule; the h2 zone label sits on its own 2px rule. Prose is
capped at `--measure` (38rem).

The spacing scale is six steps: 0.25 / 0.5 / 0.75 / 1.25 / 2 / 3.5rem
(2xs–xl). Two-column data rows (BOM rows, CV entries) share the same grid:
an 11rem left rail (balloon + kind, or period) and a fluid body, collapsing
to one column below 40rem. The title block flips from 2 to 4 columns at
48rem. The exploded figure is container-queried: below a 27rem container the
in-drawing note register hides and the HTML notes list becomes visible, so
no lettering ever renders below legible size.

The two pages are two sheets of one set: `@view-transition { navigation:
auto }` morphs the person's name between / and /cv/, disabled under reduced
motion.

### Elevation & Depth

No shadows, anywhere. A drawing has no depth to fake: hierarchy is carried by
line weight (hairline vs. 1.5–2px strong rules), by the two-step ground
(`--bg` vs. the barely-lighter `--surface` on hover and control chrome), and
by lettering size. The sticky sheet nav separates itself with a solid `--bg`
ground and a hairline rule — nothing may show through the chrome of the
sheet — never with a shadow or blur.

#### Named Rules

**The Flat Sheet Rule.** No `box-shadow`, no `backdrop-filter`, no
translucent surfaces. State is answered with a surface tint (`--surface`), a
fill swap, or a line — the devices a drawing actually has.

### Shapes

Zero radii: `--radius` and `--radius-pill` are both 0px, because a drawing
has no rounded corners. Everything is rectilinear and rule-drawn — 1px
hairlines, 1.5–2px strong lines, no fills except the paper itself.

Two notation marks are the deliberate exceptions and carry meaning:

- **The balloon** — a 1.7rem circle, 1.5px `--border-strong` stroke —
  numbers a bill-of-materials position. Circled numerals mean BOM position
  and nothing else.
- **The datum mark** — the same 1.7rem box, square — carries the figure's
  boxed note letters (A–D). Square is the figure's notation, circle is the
  list's.

### Components

#### Stamp (primary action)

- **Character:** the checker's approval stamp — outlined, uppercase, red.
- **Shape:** sharp rectangle (0px), 2px solid `--stamp` border.
- **Rest:** transparent ground, `--stamp` text, osifont, 0.08em tracking,
  uppercase, `--space-s --space-m` padding.
- **Hover:** fills `--stamp`, text flips to `--stamp-contrast`.
- **Active:** `scale(0.97)`; all transitions removed under reduced motion.
- **Cardinality:** one per sheet (see The One Stamp Rule). There is no
  secondary button — every other action is a link.

#### Links

- Engineer's blue (`--accent`), 1px underline at 0.18em offset; hover
  deepens to `--accent-strong`. Utility links (nav, title block) drop the
  underline at rest and answer hover with colour or underline. All small
  targets buy their 44px hit area with padding + negative margin so the
  glyph stays optically in place.

#### Balloon / Datum

- 1.7rem notation marks (circle / square), 1.5px `--border-strong` stroke,
  `--bg` fill, osifont at 0.8rem with tabular numerals. See Shapes for which
  is which.

#### Tags (chips)

- Hairline-bordered, transparent, `--text-muted` osifont at `--step--1`,
  0.1em/0.55em padding. Read-only spec callouts, not interactive filters.

#### BOM Row (cards)

- A parts-list row, not a card: hairline top rule, no background at rest,
  full-row hover tint to `--surface`. Grid: 11rem rail (balloon + uppercase
  kind) and body (title, description, links, tags). The title link
  stretches over the whole row (`::after` inset 0); secondary links sit
  above it on their own z-index. Hover turns the title engineer's blue and
  underlines it.

#### Navigation (sheet header)

- Sticky, solid `--bg`, hairline bottom rule. osifont at `--step--1`,
  uppercase, 0.08em tracking: SVL wordmark left (0.18em tracking), sheet
  links + theme toggle right. Current sheet: `aria-current="page"`,
  `--text` colour, underlined. Hover answers in `--accent`.

#### Title Block (footer)

- ISO 7200: a `--border-strong` bordered grid (2 cols, 4 at 48rem, then
  right-aligned at max 44rem), hairline internal rules. Each cell is a tiny
  uppercase `--text-muted` label over an uppercase value. Carries real
  provenance only: title, document type, sheet index ("1 OF 2"), scale 1:1,
  dated/drawn-by, and the package version linking the repo.

#### Exploded View (signature figure)

- Authored SVG linework of an electric kettle on a dash-dot centreline:
  `--text` part strokes (1.7), `--text-muted` fine lines (1), part names in
  a left register, boxed datum notes A–D with real dated counts in a right
  register. Leader mapping is meaningful (handle → participants, framed
  body → images, plate → components).
- **Motion:** on load the parts settle apart from the assembled position —
  one `translate` transition per part group over `--dur-explode` (700ms)
  `--ease-out`, run once. Reduced motion or no JS: the drawing is simply
  exploded, in the same stylesheet.
- **Hover:** a note lights its part in `--accent` (`:has()`, progressive).
- Container-queried note handover at 27rem (see Layout).

#### Chart (island)

- Consumes the kept token names only (`--chart-bar`, `--font-mono`,
  `--surface`, ...): solid engineer's-blue bars (never translucent — opacity
  would make real contrast unknowable), `--text-muted` 2px zero line,
  hairline grid, osifont tabular numerals. Segmented toggle: joined
  44px-tall segments in a hairline fieldset; selected segment fills
  `--accent`. Load reveal: bars grow from the baseline, 30ms stagger,
  finished inside ~730ms; measure switches ease `d` over `--dur-base`;
  reduced motion gets final states instantly.

#### Named Rules

**The Drafting Motion Rule.** Motion is drafting-derived behaviour, never
decoration: parts settle apart, bars grow from their baseline, fills swap on
the `--dur-fast`/`--dur-base` clock (150/200ms) with `--ease-out`. Every
animation is answered by a `prefers-reduced-motion` block in the same file
that declares it.

**The Real Figures Rule.** Every number on the sheet is a real, dated count
or version — inherited product truth. Data flagged as sample renders labeled
as sample or not at all; no invented placeholder ever ships as a figure.

### Do's and Don'ts

#### Do

- **Do** consume the kept token names (`--bg`, `--text`, `--accent`,
  `--chart-bar`...) for every new surface; both themes come free.
- **Do** set every figure, date, and label in osifont with
  `font-variant-numeric: tabular-nums` (`.draft` / `.tag` / `time`).
- **Do** draw hierarchy with the two rule weights (1px hairline,
  1.5–2px `--border-strong`) and the zone-label h2 (tracked caps on a 2px
  rule).
- **Do** buy 44px hit targets with padding + negative margin so glyphs stay
  optically in place.
- **Do** keep the sheet chrome on every page, the 404 included: frame, sheet
  nav, title block. A wrong URL is still a sheet of the set.

#### Don't

- **Don't** add a second red element to a sheet; one stamp, everything else
  engineer's blue.
- **Don't** round a corner (`--radius` is 0px) — the only circle is the BOM
  balloon, and circled numerals mean BOM position only; figure notes use
  square datum boxes.
- **Don't** use shadows, blur, or translucent fills; state answers with
  `--surface`, a fill swap, or a line.
- **Don't** hardcode a colour: every colour is a `light-dark()` token, and
  the two theme-color metas in Base.astro mirror `--bg` by hand — change
  them together.
- **Don't** letter prose in osifont; long text stays on the system sans, and
  `--measure` stays 38rem in rem, not ch.
