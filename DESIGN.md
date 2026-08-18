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

Taking products apart is what the author does, so the page is drawn the way a
product is drawn: an exploded view with balloons and a register, lettered
general notes, a parts list, an ISO 7200 title block, a trim frame around every
sheet. It is a measured drawing of the work, not a portfolio text column.

Two renderings of one sheet. Light mode is ink linework on warm drafting paper.
Dark mode is the same sheet as a cyanotype: pale lines on a Prussian-blue
ground, roles swapped, nothing redesigned. Colour is never the sole signal.

Every figure is real and dated: the general notes carry running counts from the
stats export, the title block carries the package version and the export dates.
The exploded view is ReLab taken apart, its six real parts, labelled schematic.

**How to read this document.** The named rules are the binding part: they say
what makes a page belong to this set, and breaking one is a decision to make
deliberately. Everything else describes the intent behind the current sheets so
a new one can be drawn in the same hand. Specific values live in
`src/styles/global.css` and in the frontmatter above, and they are settings, not
commitments: a new size, a new part of the figure, a new section, or a whole new
sheet is welcome as long as the rules still hold. This is a drawing convention
to design within, not an inventory to preserve.

**Key Characteristics:**

- Ink-on-paper light theme, cyanotype-blueprint dark theme; one `light-dark()` pair per token
- osifont ISO 3098 drafting lettering for display, labels, and all data figures
- Hairline rules and zero radii; the only circle is the figure's item balloon
- Exactly one checker's-green stamp (primary action) per sheet
- A drawn sheet frame around the whole document
- Motion is drafting behaviour only, never decoration

### Colors

Design in roles, not in hex. Two grounds, one working ink, engineer's blue for
the working accents, and checker's green for the single stamp. Every pair is one
`light-dark()` OKLCH token, and every text pair clears 4.5:1 on its ground,
verified at build time. A new colour is a new role, argued for, or it is one of
these tokens reused.

#### Primary

| Token | Role |
|---|---|
| `--accent` (Engineer's Blue) | Links and working accents, the colour an engineer annotates in |
| `--accent-strong` | The hover step |
| `--accent-contrast` | Text on a filled accent surface |

On the blueprint side the accent becomes a pale drafting cyan, because the
ground already owns the blue.

#### Secondary

| Token | Role |
|---|---|
| `--stamp` (Checker's Green) | The approval stamp: the one primary action per sheet |
| `--stamp-contrast` | Text on the filled stamp |

The stamp is outlined at rest and fills on hover. Green, not red: red marks a
correction on a drawing and an error on a screen.

#### Neutral

| Token | Role |
|---|---|
| `--bg` (Drafting Paper) | The page ground: warm paper in light, the cyanotype ground in dark |
| `--surface` (Sheet Surface) | The one raised tint, barely lighter than the ground |
| `--text` (Working Ink) | Text and part linework |
| `--text-muted` (Faded Ink) | Secondary text, fine linework, figure labels, chart axes |
| `--border` (Hairline) | Rules between rows and cells |
| `--border-strong` (Frame Line) | The sheet frame, section-heading rules, balloons, datum marks |

Hairline and Frame Line are the only two rule weights on the set. A third weight
would need a reason a draughtsman would recognise.

#### Named Rules

**The One Stamp Rule.** Exactly one checker's-green stamp per sheet. It marks
the one thing to do next; a second stamp demotes both. Every other action is an
engineer's-blue link.

**The Kept Names Rule.** The custom property names (`--bg`, `--text`,
`--accent`, `--chart-bar`, and the rest) are the previous design system's, kept
so every consumer rethemes without edits, the React chart island included.
Retheme by changing what a name resolves to; never fork a parallel palette.

**The Uniform Chroma Rule.** On `@media (color-gamut: p3)` only the chromatic
tokens lift, uniformly, never lightness. A display that claims P3 and clamps
still clears every contrast floor.

### Typography

Two faces, one job each. osifont (ISO 3098 technical lettering, vendored and
subset, weight 400 only) is the drafting hand, with a Segoe UI and system-ui
fallback. The system sans (`ui-sans-serif` stack) is the reading face.
`--font-mono` aliases `--font-draft`, so anything asking for mono gets the
drafting hand.

The drafting hand carries what a draughtsman letters: headings, labels, dates,
dimensions, data. Prose stays on the system sans, so long text reads as text.

#### Hierarchy

Seven roles, on one fluid scale. The steps are tokens, so retuning the scale
retunes the set.

| Role | Step | Used for |
|---|---|---|
| Display / h1 | `--step-3` | The sheet's one title, uppercase, lightly tracked |
| Lead (`.lead`) | `--step-2` | The line under the sheet's name, in full ink, short measure |
| Tagline (`.tagline`) | `--step-0` | The muted sentence under the lead |
| Headline / h2 | `--step-1` | Zone labels, tracked caps over a `--border-strong` rule |
| Title / h3 | `--step-1` | Part names in the parts list |
| Body | `--step-0` | Prose, capped at `--measure` |
| Label | `--step--1` | Nav links, tags, title-block cells, periods, figure labels |

A zone label is set smaller than the content it labels: it is a label, not a
statement. Weights stay at 400 throughout; hierarchy comes from size, tracking,
case, and rules.

#### Named Rules

**The Drafting Hand Rule.** Figures and data (counts, dates, versions, periods,
chart numerals) are always set in osifont with `font-variant-numeric:
tabular-nums` (the `.draft`, `.tag`, and `time` selectors). A number in the body
face is prose; a number in the drafting hand is data.

**The Measured Line Rule.** `--measure` is set in rem, not `ch`: `ch` measures
the zero glyph and overshoots by about 20 characters in a system sans. Cap prose
in rem, near 70 characters.

### Layout

The page is one tall sheet, and `body::before` draws the trim frame around the
document, not the viewport: a fixed line would strike through scrolling text.
The frame is screen only; print gets the plain document. Every page of the site
carries this chrome.

One container width governs the sheet, sized so the rail, the gutter, and the
prose measure fit with room to spare, and so rules end where the writing ends.
Sections stack on the spacing scale and carry no rule of their own: the zone
label's rule is the one line per boundary. Content that pairs a short key with a
body (work rows, CV entries) shares one two-column grid, a fixed left rail and a
fluid body, collapsing to one column on narrow screens. New sections should join
that grid rather than invent a second one.

Below the reading width, a layout may re-compose rather than merely stack: the
exploded figure becomes a compact assembly map so all its parts stay visible as
one system. Re-composing is encouraged where stacking would cost the reader the
whole picture.

Moving between sheets is a plain page load, with no cross-document view
transition: a morphing name on every switch was a distraction, not continuity.
In-page jumps scroll smoothly, `auto` under reduced motion.

### Elevation & Depth

No shadows, anywhere. Hierarchy is carried by line weight, by the two-step
ground (`--bg` against the barely-lighter `--surface`), and by lettering size.
Chrome that floats over the sheet, such as the sticky nav, separates itself with
a solid ground and a rule, never with a shadow or blur.

#### Named Rules

**The Flat Sheet Rule.** No `box-shadow`, no `backdrop-filter`, no translucent
surfaces. State is answered with a surface tint, a fill swap, or a line: the
devices a drawing has.

### Shapes

Zero radii: `--radius` and `--radius-pill` are both 0px. Everything is
rectilinear and rule-drawn, with no fills except the paper itself. Two notation
marks are the deliberate exceptions, and they are notation, not decoration:

- **The balloon**, a circle with a `--border-strong` stroke, numbers an item on
  a figure and is keyed to that figure's register. Circled numerals mean a
  figure item and nothing else.
- **The datum mark**, a square box, carries lettered references: the general
  notes (A–D) and the zone index.

A future figure may add balloons and a register of its own. Nothing else earns a
circle.

### Components

A component belongs to this set when it is drawn rather than styled: rules and
lettering carry it, it consumes tokens by their kept names, it answers state
with a tint, a fill swap, or a line, and it needs no colour to be understood.
Build a new one against the rules above; the sheets today carry these.

| Component | What governs it |
|---|---|
| Stamp | The One Stamp Rule: one per sheet, outlined then filled, no secondary button exists |
| Links | Engineer's blue and underlined; utility links drop the underline at rest and answer hover with colour |
| Balloon / datum | Notation marks only, `--border-strong` stroke on a `--bg` fill, drafting hand with tabular numerals |
| Tags | Read-only spec callouts, hairline and transparent, never interactive filters |
| Work row | A parts-list row, not a card: a top rule, no background, no hover tint, the part name as the target |
| Sheet nav | Sticky, solid ground, hairline rule; current sheet marked with `aria-current="page"` and ink, not colour alone |
| Title block | ISO 7200 provenance, and the one place the profile links live |
| Exploded view | The signature figure; see below |
| General notes | Datum-lettered running totals, sitting with the platform they describe |
| Chart island | Kept token names only, solid bars, drafting numerals, controls in a ruled fieldset |

Every interactive target buys a 44px hit area with padding plus negative margin,
so the glyph stays optically in place.

#### The signature figure

The exploded view is authored SVG linework of a real system taken apart on a
dash-dot centreline, in flat front elevation, with part strokes heavier than
fine lines. Each part carries a balloon on a short leader, and a register keys
the numbers to part names. Part and label are one link to the real thing, named
for assistive tech, with a drawn arrow in the register so a row reads as a link
before hover; hover and focus answer in ink, not in a box, so the whole
silhouette is the target. The drawing carries no statistics and no dimensions,
and the caption says "schematic".

Captions are global: under the figure, "Fig. N:" first, one style for every
figure on the set. A second figure inherits all of this.

#### Named Rules

**The Drafting Motion Rule.** Motion is drafting-derived behaviour, never
decoration: parts settle apart from an assembled stack, bars grow from their
baseline, fills swap on the `--dur-fast`/`--dur-base` clock. Reveal motion runs
once, on load. Every animation is answered by a `prefers-reduced-motion` block
in the file that declares it, and the reduced state is the finished state, never
a missing one.

**The Real Figures Rule.** Every number on the sheet is a real, dated count or
version, inherited product truth. Counts come from the stats export
(`stats.json`); while that export is flagged `sample`, the sheet falls back to
the last dated counts the platform itself reported, kept in `index.astro`. Data
flagged as sample renders labelled as sample or not at all. No invented
placeholder ever ships as a figure.

### Do's and Don'ts

#### Do

- **Do** consume the kept token names for every new surface; both themes come
  free.
- **Do** set every figure, date, and label in the drafting hand with
  `font-variant-numeric: tabular-nums` (`.draft` / `.tag` / `time`).
- **Do** draw hierarchy with the two rule weights and the zone-label h2.
- **Do** buy 44px hit targets with padding plus negative margin.
- **Do** keep the sheet chrome on every page, the 404 included: frame, sheet
  nav, title block. A wrong URL is still a sheet of the set.
- **Do** add sheets, sections, figures, and components. The set is meant to
  grow; the rules are what keep a new one legible beside the old ones.

#### Don't

- **Don't** add a second stamp to a sheet; one stamp, everything else
  engineer's blue.
- **Don't** round a corner (`--radius` is 0px); the only circle is a figure's
  item balloon.
- **Don't** use shadows, blur, or translucent fills; state answers with
  `--surface`, a fill swap, or a line.
- **Don't** hardcode a colour: every colour is a `light-dark()` token, and the
  two theme-color metas in Base.astro mirror `--bg` by hand; change them
  together.
- **Don't** letter prose in osifont, and don't cap the measure in `ch`.
