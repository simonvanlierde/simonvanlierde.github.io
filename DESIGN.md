---
name: Simon van Lierde, Engineering Drawing Set
description: "A personal site drawn as one ISO technical drawing set: exploded view with balloons, general notes, parts list, title block."
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
  checkers-green: "light-dark(oklch(44% 0.11 150), oklch(82% 0.1 150))"
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
    textColor: "{colors.checkers-green}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.75rem 1.25rem"
  stamp-hover:
    backgroundColor: "{colors.checkers-green}"
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
with balloons and a register, lettered general notes, a parts list, an ISO 7200
title block, a trim frame around every sheet. The refused
alternative is the minimal developer-portfolio text column: this site is a
measured drawing of the work, not an essay about it.

One world, two renderings of the same sheet. Light mode is ink linework on
warm drafting paper; dark mode is the same sheet printed as a cyanotype:
pale lines on a Prussian-blue ground, roles swapped, nothing redesigned.
Display, labels, and every number are set in osifont, the ISO 3098 technical
lettering face (vendored, latin-subset, ~10KB); long prose stays on the system
sans so text reads as text, not as a costume. Colour is never the sole signal.

Every figure is real and dated: the ReLab row's general notes carry the platform's actual running
counts from the stats export, the title block carries the real package version and export dates. The
exploded view is ReLab itself taken apart, its six real parts, labelled schematic; it carries no
statistics: a drawing shows parts and names, the numbers live in the notes. Nothing decorative,
nothing invented.

**Key Characteristics:**

- Ink-on-paper light theme, cyanotype-blueprint dark theme; one `light-dark()` pair per token
- osifont ISO 3098 drafting lettering for display, labels, and all data figures
- Hairline rules and zero radii everywhere; the only circle is the figure's item balloon
- Exactly one checker's-green stamp (primary action) per sheet
- A drawn sheet frame around the whole document
- Motion is drafting behaviour only: the exploded view settles apart once on load

### Colors

Two grounds, one working ink, engineer's blue for the working accents, and
checker's green for the single stamp; every pair is one `light-dark()` OKLCH
token, and every text pair clears 4.5:1 on its ground (verified at build
time). The frontmatter values are the normative source, mirrored from
`src/styles/global.css`.

#### Primary

- **Engineer's Blue** (`--accent`): links and working accents, the colour an
  engineer annotates in. On the blueprint side it becomes a pale drafting
  cyan, because the ground already owns the blue. `--accent-strong` is the
  hover step; `--accent-contrast` is the text colour on a filled accent
  surface (selected chart toggle, skip link, ::selection).

#### Secondary

- **Checker's Green** (`--stamp`): the approval-stamp colour, reserved for
  the one primary action per sheet: the CV on Sheet 1 (a hiring reader wants
  to read before writing; the address is a plain link beside it), the PDF
  download on Sheet 2. Green, not red: red on a drawing marks a correction
  and on a screen reads as an error; green is the checker's approval.
  Outlined at rest, filled on hover with `--stamp-contrast` text.

#### Neutral

- **Drafting Paper** (`--bg`): the page ground. Warm near-white paper in
  light; deep Prussian blue in dark, where it is the cyanotype ground.
- **Sheet Surface** (`--surface`): the one raised tint, the chart control
  fieldset. Barely lighter than the ground.
- **Working Ink** (`--text`): near-black blue ink for text and part linework;
  near-white on the blueprint.
- **Faded Ink** (`--text-muted`): secondary text, fine linework, figure
  labels, chart axes.
- **Hairline** (`--border`) and **Frame Line** (`--border-strong`): the two
  rule weights. Hairline separates rows and cells; the strong line draws the
  sheet frame, section-heading rules, balloons, and datum marks.

#### Named Rules

**The One Stamp Rule.** Exactly one checker's-green stamp per sheet. The
stamp marks the checker's approval, the one thing to do next; a second stamp
on the same sheet demotes both. Every other action is an engineer's-blue
link.

**The Kept Names Rule.** The CSS custom property names (`--bg`, `--text`, `--accent`,
`--chart-bar`, ...) are the previous design system's names, kept so every consumer, the React chart
island included, rethemes without edits. New surfaces consume tokens by these names; never fork a
parallel palette.

**The Uniform Chroma Rule.** Wide-gamut displays (`@media (color-gamut: p3)`)
lift only the chromatic tokens, uniformly (+~20% chroma), never lightness: a
display that claims P3 and clamps still clears every contrast floor.

### Typography

**Display Font:** osifont (with Segoe UI, system-ui fallback), ISO 3098
technical lettering, vendored and subset (~10KB), weight 400 only
**Body Font:** system sans (ui-sans-serif stack)
**Label/Mono Font:** osifont; `--font-mono` aliases `--font-draft`

**Character:** The drafting hand carries everything a draughtsman would
letter: headings, labels, dates, dimensions, data. Prose stays on the system
sans so long text reads as text. The pairing is a working document's voice:
lettered where it is a drawing, typeset where it is reading matter.

#### Hierarchy

- **Display / h1** (400, `--step-3` = clamp(2.1–3.4rem), 1.12): the sheet's
  one title, uppercase, 0.02em tracking.
- **Lead** (`.lead`: 400, `--step-2`, 1.3, 0.01em, full ink, max 30rem,
  balanced): the line under the sheet's name, the same on both sheets: the
  thesis on Sheet 1, the first part of the headline on Sheet 2.
- **Tagline** (`.tagline`: `--step-0`, `--text-muted`, prose measure): the
  sentence under the lead: the positioning on Sheet 1, the rest of the
  headline on Sheet 2.
- **Headline / h2** (400, `--step-1` = clamp(1.2–1.45rem), 1.12): zone
  labels, smaller than the content they label, tracked caps (0.14em) over a
  2px `--border-strong` rule. A label, not a statement.
- **Title / h3** (400, `--step-1`, 1.12): part names in the BOM, 0.02em.
- **Body** (400, `--step-0` = clamp(1–1.1rem), 1.6): prose, max-width
  `--measure` (38rem).
- **Label** (400, `--step--1` = clamp(0.83–0.9rem), 0.04–0.14em tracking,
  usually uppercase): nav links, tags, title-block cells, periods, figure
  labels.

#### Named Rules

**The Drafting Hand Rule.** Figures and data (counts, dates, versions,
periods, chart numerals) are always set in osifont with
`font-variant-numeric: tabular-nums` (the `.draft`, `.tag`, and `time`
selectors). A number in the body face is prose; a number in the drafting hand
is data.

**The Measured Line Rule.** `--measure` is 38rem, in rem, not `72ch`: `ch` measures the zero glyph
and lands near 91 real characters in a system sans; 38rem lands near 70. Cap prose in rem.

### Layout

The page is one tall sheet. The body carries `padding: calc(--frame-inset +
--frame-line)` and `body::before` draws the trim frame: a 1.5px
`--border-strong` border, absolute on the **document**, not viewport-fixed
(a fixed line would strike through scrolling text). No centring ticks: they
read as stray marks at the viewport edges. Screen only; print gets the plain
document. `--frame-inset` is clamp(8px, 1.2vw, 16px).

Inside the frame: `.container` is `min(100% - 2 * --space-m, 54rem)`,
centred: an 11rem rail, a 2rem gutter and a 38rem measure with 3rem to
spare, so rules end where the writing ends and the paper is no wider than
the drawing. Sections stack with `padding-block: --space-l --space-xl` (2rem
above, 3.5rem below) and no rule of their own: the h2 zone label's 2px rule
is the one line per boundary. On Sheet 2 a lettered zone index (datum marks
A–H linking the sections) sits under the header. Prose is
capped at `--measure` (38rem).

The spacing scale is six steps: 0.25 / 0.5 / 0.75 / 1.25 / 2 / 3.5rem
(2xs–xl). Two-column data rows (work rows, CV entries) share the same grid:
an 11rem left rail (kind, or period) and a fluid body, collapsing
to one column below 40rem. The title block is the full container width:
four cells (title, document, sheet, dated) over a contact cell spanning three
and the site revision (two columns below 40rem, the wide cells taking a row
each). The exploded figure caps at 20rem, plate size beside the hero text,
and needs no container query: its only lettering is the left part-name
register, legible at every width. (If a container query is ever added,
remember it can style only the container's descendants, never the container
itself.) The general notes sit in the ReLab row of the parts list, under its
links, so everything about the platform is read in one place; the hero
carries the person, the one stamp, and the figure.

The two pages are two sheets of one set, and navigating between them is a
plain page load: no cross-document view transition (a morphing name on every
switch was a distraction, not continuity). In-page jumps (the zone index,
Fig. 1's caption to the ReLab row) scroll smoothly, `auto` under reduced
motion.

### Elevation & Depth

No shadows, anywhere. A drawing has no depth to fake: hierarchy is carried by
line weight (hairline vs. 1.5–2px strong rules), by the two-step ground
(`--bg` vs. the barely-lighter `--surface` on hover and control chrome), and
by lettering size. The sticky sheet nav separates itself with a solid `--bg`
ground and a hairline rule (nothing may show through the chrome of the
sheet), never with a shadow or blur.

#### Named Rules

**The Flat Sheet Rule.** No `box-shadow`, no `backdrop-filter`, no
translucent surfaces. State is answered with a surface tint (`--surface`), a
fill swap, or a line: the devices a drawing has.

### Shapes

Zero radii: `--radius` and `--radius-pill` are both 0px, because a drawing
has no rounded corners. Everything is rectilinear and rule-drawn: 1px
hairlines, 1.5–2px strong lines, no fills except the paper itself.

Two notation marks are the deliberate exceptions and carry meaning:

- **The balloon**, a circle with a `--border-strong` stroke, numbers an
  item on the figure, keyed to the figure's register. Circled numerals mean
  a figure item and nothing else; the work list carries no numbers.
- **The datum mark**, a 1.7rem box, square, carries the general notes'
  letters (A–D) and the CV's zone index. Square is the notes' notation,
  circle is the drawing's.

### Components

#### Stamp (primary action)

- **Character:** the checker's approval stamp: outlined, uppercase, green.
- **Shape:** sharp rectangle (0px), 2px solid `--stamp` border.
- **Rest:** transparent ground, `--stamp` text, osifont, 0.08em tracking,
  uppercase, `--space-s --space-m` padding.
- **Hover:** fills `--stamp`, text flips to `--stamp-contrast`.
- **Active:** `scale(0.97)`; all transitions removed under reduced motion.
- **Cardinality:** one per sheet (see The One Stamp Rule). No secondary
  button exists; every other action is a link.

#### Links

- Engineer's blue (`--accent`), 1px underline at 0.18em offset; hover
  deepens to `--accent-strong`. Utility links (nav, title block) drop the
  underline at rest and answer hover with colour or underline. All small
  targets buy their 44px hit area with padding + negative margin so the
  glyph stays optically in place.

#### Balloon / Datum

- Notation marks (circle on the figure / 1.7rem square in HTML), 1.5px
  `--border-strong` stroke, `--bg` fill, osifont with tabular numerals. See
  Shapes for which is which.

#### Tags (chips)

- Hairline-bordered, transparent, `--text-muted` osifont at `--step--1`,
  0.1em/0.55em padding. Read-only spec callouts, not interactive filters.

#### Work Row (cards)

- A parts-list row, not a card: hairline top rule, no background, no hover
  tint. Grid: 11rem rail (uppercase kind) and body (title,
  description, links, tags). The part name is the target (44px bought with
  padding + negative margin), underlined at rest so it reads as a link
  before hover; the row's prose stays selectable. Hover turns the title
  engineer's blue.

#### Navigation (sheet header)

- Sticky, solid `--bg`, hairline bottom rule. osifont at `--step--1`,
  uppercase, 0.08em tracking: SVL wordmark left (0.18em tracking), sheet
  links + theme toggle right. Current sheet: `aria-current="page"`,
  `--text` colour, underlined. Hover answers in `--accent`.

#### Title Block (footer)

- ISO 7200: a `--border-strong` bordered grid the full width of the
  container (four cells over contact + site rev), hairline internal rules
  drawn by a 1px `--border` grid gap. Each cell is a tiny uppercase
  `--text-muted` label over an uppercase value. Carries real provenance:
  title, document type, sheet index ("1 OF 2"), dated/drawn-by, and "Site
  rev", the package version linking the repo. No scale cell: nothing on a
  web page is drawn to scale.
- **Contact cell:** the one place the profile links live, on both sheets:
  the address (in `--accent`, the way in), GitHub, LinkedIn, ORCID, Leiden
  profile, as text in the drafting hand, sentence case. Each sheet's header
  repeats only the address beside its stamp (the first-viewport action);
  nothing else about contact is said twice.

#### Exploded View (signature figure)

- Authored SVG linework of ReLab, the lab's own platform, taken apart on a
  dash-dot centreline, capture end at the top: camera rig (RPi board and
  module), capture app (phone), web app (browser window), API (rack unit),
  database (cylinder), docs (bound sheet), all in flat front elevation;
  `--text` part strokes (1.7), `--text-muted` fine lines (1). Each part
  carries a balloon (①–⑥, `--border-strong` circle, `--bg` fill) on a
  short leader; the left register keys the numbers to part names, so the
  figure has the drawing half of the balloon convention. Every part is one
  the CV export and the ReLab row already state. No statistics and no
  dimension on the drawing; caption says "schematic".
- **Motion:** on load the parts settle apart from the assembled stack: one
  `translate` transition per part group over `--dur-explode` (700ms)
  `--ease-out`, run once, class set by an inline script right after the
  figure so it precedes first paint. Reduced motion or no JS: the drawing is
  exploded from the start, in the same stylesheet.
- **Links:** each part and its register label are one SVG `<a>` to the
  real thing (plugin repo, live app, docs, source), named "Part: destination"
  for assistive tech, opening in the same tab like every other link on the
  set. The register's last column is a drawn arrow out in the link colour
  (`--accent`, 1.4 stroke) so each row reads as a link off the sheet before
  hover; the caption says so too. Hover or focus lights part and label in
  `--accent` and the arrow in `--accent-strong` (nudging 1px out; not under
  reduced motion); the
  part's fill is `transparent`, so the whole silhouette is the target, and
  the ring is the ink change, not a box. Balloons, labels and arrows travel
  with their parts during the settle.
- **Caption:** "Fig. 1: ReLab, drawn exploded. Schematic; each part opens
  its code, app, or docs.", the name linking the ReLab row. Every figure on
  the set captions the same way: one global `figcaption` style, under the
  figure, "Fig. N:" first (Fig. 2 is the chart's caption prop).

#### General Notes (ReLab row)

- The sheet's boxed notes, in the ReLab row after its links (max
  `--measure`): an uppercase "Notes · running totals" h4 in the drafting
  hand on a `--border-strong` rule, then a 2×2 grid of datum-lettered
  entries (A–D), value at `--step-3` in the drafting hand, uppercase label
  at `--step--1`, and a footer line "As counted <month year>." The row's
  title and links already name and link the platform, so the notes do not.
- Values come from `stats.json` (`totals`, `as_of`); while the export is
  still flagged `sample` they fall back to the last hand-counted, dated
  totals kept in `index.astro`, so the notes always show real figures and
  never the seeded series. Participants is a hand-kept literal. The chart
  below them ships only on real data; the dev server may draw the seeded
  series, labelled sample, for preview.

#### Chart (island)

- Consumes the kept token names only (`--chart-bar`, `--font-mono`,
  `--surface`, ...): solid engineer's-blue bars (never translucent: opacity
  would make real contrast unknowable), `--text-muted` 2px zero line,
  hairline grid, osifont tabular numerals. Segmented toggle: joined
  44px-tall segments in a hairline fieldset; selected segment fills
  `--accent`; on a narrow plot the strip scrolls sideways as one control
  (thin scrollbar) rather than wrapping into two rows. Load reveal: bars
  grow from the baseline, 30ms stagger,
  finished inside ~730ms; measure switches ease `d` over `--dur-base`;
  reduced motion gets final states instantly.

#### Named Rules

**The Drafting Motion Rule.** Motion is drafting-derived behaviour, never
decoration: parts settle apart, bars grow from their baseline, fills swap on
the `--dur-fast`/`--dur-base` clock (150/200ms) with `--ease-out`. Every
animation is answered by a `prefers-reduced-motion` block in the same file
that declares it.

**The Real Figures Rule.** Every number on the sheet is a real, dated count
or version, inherited product truth. Data flagged as sample renders labeled
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

- **Don't** add a second stamp to a sheet; one stamp, everything else
  engineer's blue.
- **Don't** round a corner (`--radius` is 0px): the only circle is the
  figure's item balloon, and circled numerals mean a figure item only;
  general notes and the zone index use square datum boxes.
- **Don't** use shadows, blur, or translucent fills; state answers with
  `--surface`, a fill swap, or a line.
- **Don't** hardcode a colour: every colour is a `light-dark()` token, and
  the two theme-color metas in Base.astro mirror `--bg` by hand; change
  them together.
- **Don't** letter prose in osifont; long text stays on the system sans, and
  `--measure` stays 38rem in rem, not ch.
