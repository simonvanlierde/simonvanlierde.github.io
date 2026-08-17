---
name: Simon van Lierde
description: Personal site of a PhD researcher and research software engineer in industrial ecology.
colors:
  hue-neutral: "222"
  hue-teal: "184"
  bg: "light-dark(oklch(99% 0.002 222), oklch(18.5% 0.01 222))"
  surface: "light-dark(oklch(100% 0 222), oklch(23% 0.013 222))"
  text: "light-dark(oklch(24% 0.012 222), oklch(94% 0.007 222))"
  text-muted: "light-dark(oklch(49% 0.021 222), oklch(74% 0.018 222))"
  border: "light-dark(oklch(92.5% 0.006 222), oklch(31% 0.017 222))"
  accent: "light-dark(oklch(51% 0.086 184), oklch(85.5% 0.125 184))"
  accent-strong: "light-dark(oklch(41% 0.068 184), oklch(91% 0.093 184))"
  accent-contrast: "light-dark(oklch(100% 0 222), oklch(24% 0.038 184))"
  focus: "light-dark(oklch(51% 0.086 184), oklch(85.5% 0.125 184))"
  chart-bar: "light-dark(oklch(51% 0.086 184), oklch(78.5% 0.133 184))"
  chart-bar-strong: "light-dark(oklch(41% 0.068 184), oklch(85.5% 0.125 184))"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(2rem, 1.6rem + 2vw, 3rem)"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline:
    fontSize: "clamp(1.5rem, 1.3rem + 1vw, 2rem)"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontSize: "clamp(1.2rem, 1.1rem + 0.5vw, 1.45rem)"
    fontWeight: 650
    lineHeight: 1.15
  body:
    fontSize: "clamp(1rem, 0.96rem + 0.2vw, 1.1rem)"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "ui-monospace, SF Mono, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace"
    fontSize: "clamp(0.83rem, 0.8rem + 0.15vw, 0.9rem)"
    fontWeight: 400
    letterSpacing: "0.04em"
rounded:
  sm: "4px"
  pill: "999px"
spacing:
  2xs: "0.25rem"
  xs: "0.5rem"
  s: "0.75rem"
  m: "1.25rem"
  l: "2rem"
  xl: "3.5rem"
  2xl: "5.5rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-contrast}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1.25rem"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.accent-strong}"
    textColor: "{colors.accent-contrast}"
  plate:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
    padding: "1.25rem 0"
    typography: "{typography.body}"
  plate-rail:
    textColor: "{colors.text-muted}"
    width: "11rem"
    typography: "{typography.label}"
  chip:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
    padding: "0.1em 0.55em"
    typography: "{typography.label}"
  segment:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
    padding: "0.4em 1em"
    height: "44px"
    typography: "{typography.label}"
  segment-pressed:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-contrast}"
  version-chip:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.pill}"
    padding: "0.45em 0.7em"
    typography: "{typography.label}"
---

## Design System: Simon van Lierde

### Overview

**Creative North Star: "The Lab Data Sheet"**

A researcher's instrument panel, not a portfolio brochure. Everything reads as if
printed for measurement, and the page stays quiet: an element that raises its
voice without carrying data costs more than it returns.

Density is generous rather than packed. Long-form measure caps at 72ch, sections
separate with 3.5rem of air and a single top rule, and the accent appears on a
handful of elements per screen. Both themes live in one `light-dark()` token, so
neither is the afterthought; the dark palette is tuned separately where a
light-mode value would misbehave (chart fills step down from the accent, because
text-tuned teal glares at large sizes).

Rejected: card grids as page structure, card-grid-with-icon scaffolds, gradient
text, glass and blur as decoration, shadow stacks, and monospace as a costume for
"technical".

**Key Characteristics:**

- One layout primitive: an indexed rail beside a body, ruled, never boxed
- Flat and border-defined; no shadows anywhere in the system
- One accent, tuned per theme, on links, one button, data marks, and focus
- Mono for data only: periods, tags, axis labels, version, wordmark
- Fluid type and space via `clamp()`; no fixed breakpoint jumps in type
- Components query their container, not the viewport
- System font stacks, zero webfonts, zero layout shift from type loading
- Motion is opt-in and reversible: every animation has a reduced-motion answer,
  including the cross-document transition between the two pages

### Colors

A cool near-neutral ground, and one muted sea-green doing all the semantic work.
Authored in OKLCH: every token leads with its perceptual lightness, and two hue
numbers (`222` neutral, `184` teal) carry the whole site. The two themes are one
lightness ladder read from opposite ends, so neither is the afterthought.

#### Primary

- **Sea Green** (`{colors.accent}`): links, the filled primary button, chart bars,
  the pressed segment in the measure switcher, the focus ring. A deep muted teal at
  L 51 on light, measuring 5.5:1 on `{colors.surface}`; a pale mint at L 85.5 on
  dark, measuring 11.4:1, so thin text stays readable in both.
- **Deep Sea Green** (`{colors.accent-strong}`): the hover step for anything
  already wearing the accent, and the darker of the two chart-bar fills.
- **Accent Contrast** (`{colors.accent-contrast}`): the only text colour permitted
  on an accent fill. White on light, near-black spruce on dark.

#### Neutral

- **Paper** (`{colors.bg}`): the page ground, and chips sitting on a raised
  surface.
- **Sheet** (`{colors.surface}`): control panels and the chart's segmented control.
  One step off the ground, not lifted.
- **Ink** (`{colors.text}`): body copy, headings, chart numerals.
- **Graphite** (`{colors.text-muted}`): supporting copy, periods, organisations,
  axis labels, captions, footer. Carries roughly 6:1, so it reads rather than
  decorates.
- **Hairline** (`{colors.border}`): plate rules, section rules, gridlines, chip
  outlines. The system's only structural device.

#### Named Rules

#### Wide gamut

The teal values sit at 83-96% of what sRGB can express at their lightnesses, so on
a P3 display the accent is clipped rather than chosen. A `@media (color-gamut: p3)`
block lifts the four teal tokens by a uniform **1.25x chroma** — L 51 goes from
C 0.086 to 0.107, dark's chart bar from 0.133 to 0.166 — landing every value at
73-88% of the P3 maximum. Same ladder, same hue, same relationships; only the
container changed. Neutrals stay put: at chroma 0.02 there is nothing to recover,
and a more colourful grey is not an upgrade.

**The Safe-If-Wrong Rule.** A capability query reports what a display claims, not
what it does. The wide-gamut values are chosen so that a display which claims P3 and
then clamps to sRGB still clears every contrast floor: measured 5.31:1 on light and
11.67:1 on dark, against 4.5:1. A gamut upgrade may cost a little saturation
fidelity when it guesses wrong; it may never cost legibility.

**The Two Hues Rule.** The palette holds exactly two hue values, and every token
cites one of them by name. A colour that needs a third hue needs a reason first.

**The Ladder Rule.** Lightness is the palette's structure and it is written in the
value: read the first number of any token and you know where it sits. A new token
declares its rung; it does not get eyeballed against a hex.

**The One Accent Rule.** One accent hue, never a second for variety. If two things
on a screen both need emphasis, one of them is not important.

**The Data Colour Rule.** Marks that carry data (`{colors.chart-bar}`) use a
separate token from text accents: same hue, different rung. On dark the accent sits
at L 85.5 for thin text and glares as a large fill, so bars drop to L 78.5. Both
clear 3:1 against `{colors.surface}`; the chart measures 9.1:1.

**The Solid Fill Rule.** Marks are never translucent: opacity blends a mark with
whatever sits behind it and makes its real contrast unknowable. Change the fill
step instead. Small text too, where opacity dropped the chart's year labels to
3.5:1.

### Typography

**Display Font:** system sans (`ui-sans-serif, system-ui`, then Segoe UI / Roboto)
**Body Font:** the same system sans
**Label/Mono Font:** system mono (`ui-monospace`, then SF Mono / Menlo / Consolas)

**Character:** One sans voice carries everything readable, one mono voice
everything measurable. The pairing stays plain: the page argues that the work is
precise, and a display face with opinions would argue something else. Headings sit
at weight 650 with -0.01em tracking, tight enough to feel set rather than typed.

#### Hierarchy

- **Display** (650, `{typography.display.fontSize}`, 1.15): the page's one `h1`,
  the person's name. Balanced wrapping via `text-wrap: balance`.
- **Headline** (650, `{typography.headline.fontSize}`, 1.15): section headings, one
  per `<section>`, each announced through `aria-labelledby`.
- **Title** (650, `{typography.title.fontSize}`, 1.15): plate titles and CV roles.
  Work plates render theirs in mono, because the title *is* a repository name.
- **Body** (400, `{typography.body.fontSize}`, 1.6): all prose. Measure caps at
  72ch (`--measure`); the hero's larger tagline caps at 46rem, landing near 65
  characters rather than 78.
- **Label** (400, `{typography.label.fontSize}`, 0.04em as a control): periods,
  tags, axis ticks, the `SVL` wordmark, the version chip. Always mono, always a
  figure or an identifier.

#### Named Rules

**The Mono Means Data Rule.** Monospace marks a number, a date, a period, an
identifier, or a repository name. Never prose dressed as technical.

**The Rendered Size Rule.** Type inside an SVG scales with its viewBox, so its
declared size is not its real size. Verify chart type in rendered CSS pixels at
the narrowest viewport it ships to: 12px in a 720-unit box drawn at 475px is 8
real pixels.

### Layout

A single centred column, `min(100% - 2.5rem, 64rem)`, with all rhythm from one
spacing scale (0.25rem to 5.5rem). Sections take 3.5rem of padding and one
hairline top rule; the first section drops the rule.

**There is one layout primitive: a rail and a body.** Above 40rem every list on
the site is an 11rem left rail beside a body column, and the rail always carries
the item's index: a period on the CV timeline, a group name in the skills list, a
year on a publication, what-the-thing-is on a work plate. Below 40rem the rail
becomes the first line of the item and the grid collapses to one column. Nothing
on this site is a grid of boxes; the page is a catalogue read top to bottom.

Anything scrolled to by fragment reserves 4rem of `scroll-margin-top`, because the
landing page's nav is sticky and 48px tall.

**The One Grammar Rule.** A new list of things takes the rail and body, or it
justifies itself in writing. A card grid was the incumbent answer here and it
produced same-size boxes, ragged final rows, and voids inside the short ones.

**The Fluid-Not-Stepped Rule.** Type and space interpolate with `clamp()`. Media
and container queries change *composition* (rails, stacking, which chart labels
survive), never font sizes.

**The Query-The-Container Rule.** A component asks how much room *it* has, not how
wide the window is. The chart's compact treatment is keyed to a named `chart`
container, because a 26rem plot needs the same treatment whether it is narrow from
being on a phone or from sitting in a column. Reach for a media query only for
things that genuinely belong to the viewport.

### Elevation & Depth

There are no shadows. Depth is one step of tonal separation (`{colors.surface}` on
`{colors.bg}`) plus a 1px hairline, and that is the whole vocabulary. The sticky
nav is the single exception to flatness, and it earns it only while floating: at
rest the bar has no rule, no ground and no blur, and it takes all three the moment
it detaches, via `@container scroll-state(stuck: none)`. It flattens to a static,
unblurred bar under reduced motion.

**The Border-Not-Shadow Rule.** Elevation is declared once, with a border. An
element with both a hairline and a shadow is a ghost card.

**The Earn-It-While-Floating Rule.** Chrome that overlaps content states itself:
ground, blur and a rule while stuck, none of it at rest. A bar that always looks
detached is decoration.

### Shapes

One radius does nearly everything: 4px (`{rounded.sm}`) on buttons, chips, control
groups, and the chart tooltip. The pill (`{rounded.pill}`) belongs to one small
standalone control, the footer version chip. Nothing else is round.

Rules are 1px and always `{colors.border}`, and they are the site's main structural
device: a plate is a rule and a row, not a box. Corners stay crisp: this is a
measurement surface, and soft 12-16px corners would read as an app card.

**The Two Radii Rule.** Two radii exist. A third is drift, not a decision.

**The No-Box Rule.** Content is separated by rules and space, not by outlines. If
something needs a border on all four sides to read as a unit, the spacing around it
is wrong.

### Components

#### Buttons

- **Shape:** 4px corners (`{rounded.sm}`), never pill, never square.
- **Primary:** accent fill with `{colors.accent-contrast}` text,
  `0.75rem 1.25rem` padding, weight 600, no border. Exactly one per surface: the
  hero's Email link and the CV's PDF download.
- **Hover / Focus:** background steps to `{colors.accent-strong}` over 150ms;
  focus draws the global 3px `{colors.focus}` ring at 2px offset.
- **Secondary:** none. Secondary actions are plain links in a `.link-list`, with
  an optional 1.05em inline icon at cap height.

#### Chips

- **Style:** `{colors.bg}` fill, hairline border, mono label at `{typography.label}`,
  4px corners, `0.1em 0.55em` padding.
- **State:** static. Chips label technologies and skills: never controls, never
  filters, never selected.

#### Plates (the work list)

The catalogue row that replaced the card grid, and the shape every list of things
takes.

- **Structure:** a 1px `{colors.border}` top rule, 1.25rem of vertical padding, an
  11rem mono rail and a body column. No box, no fill, no padding on the sides.
- **Rail:** what the item *is*, in two or three words, from the project's `kind`
  field: "observability stack", "pre-commit hook", "thesis + dashboard". It falls
  back to the leading tag, which is then dropped from the tag list.
- **Body:** a mono title linking the repository, a description capped at
  `{--measure}` rather than at the column, secondary links, then the tag list.
- **Hover:** the top rule takes `{colors.accent}` over 150ms. The rule is the
  affordance; there is no box to light up.
- **Lead plate:** sets its title in sans at `{typography.headline}` because that one
  is a platform with a name, not a repository slug, and it carries the chart.

**The Rail Says What It Is Rule.** The rail names the kind of artefact, never a
technology already visible in the tags. A column of rails that reads "Python,
Python, Python" is a column carrying no information.

#### Navigation

- **Style:** sticky, mono `SVL` wordmark at 0.18em tracking on the left; icon links
  and the theme toggle on the right. Ground, blur and rule appear only while stuck
  (see Elevation & Depth).
- **States:** the icon copies of the hero links stay hidden until the real links
  scroll out of view, then fade and slide in on a 40ms-per-item stagger, driven by
  an IntersectionObserver. Under reduced motion the bar goes static and the icons
  fade in without moving.
- **Targets:** every standalone control clears 44px, via padding plus an equal
  negative margin so the glyph stays optically where it was.

#### Disassembly chart (signature component)

The one bespoke component: an SVG bar series in a 480x240 user-unit box, with
totals tiles above it and a mono segmented control switching measures. Bars are
solid `{colors.chart-bar}`, gridlines are hairlines, and the zero baseline is
heavier than the gridlines because the bars stand on it. Three parallel readings
of the same data: the plot for sighted users, a visually hidden table for
assistive tech, and a polite live region announcing the active measure and total.
It is capped at 30rem, which is the 480-unit box at 1:1, because a wider plot
scales 13px labels up into 19px ones: the chart has one correct size. Below a 26rem
*container* the y-axis numerals step aside, the month labels scale up in user units,
and the totals tiles go two by two, because scaling the whole box down shrinks type
faster than bars.

**The Honest Data Rule.** The chart renders only when its data is real. While the
stats export is flagged `sample`, the entire block, tiles included, is absent from
the page. A disclaimer under a fabricated series advertises the problem instead of
fixing it, and no figure may appear twice on one surface from two sources.

### Do's and Don'ts

#### Do

- **Do** define every colour once, in one `light-dark()` token.
- **Do** spend the accent on links, one filled button, data marks, and focus.
- **Do** state depth with a 1px hairline and one tonal step.
- **Do** give every animation a `prefers-reduced-motion` answer in the same file,
  gating motion behind `no-preference` rather than undoing it afterwards.
- **Do** verify chart type in rendered CSS pixels at the narrowest shipped width.
- **Do** pair every visual data display with a text equivalent: hidden table, live
  region, or both.
- **Do** size standalone controls to 44px with padding plus negative margin.
- **Do** give a new list of things the rail-and-body shape.
- **Do** ask the container, not the viewport, when a component's own width is what
  the rule is really about.
- **Do** name what a thing is in its rail, and leave technologies to the tags.

#### Don't

- **Don't** add a shadow. Not on a plate, not on the nav, not on hover.
- **Don't** box content that rules and space can separate.
- **Don't** introduce a second accent hue or a third radius.
- **Don't** quiet text with `opacity`. Use a lighter token, or smaller type.
- **Don't** set prose in mono, or figures in sans.
- **Don't** ship placeholder or sample figures to a visitor-facing surface, even
  labelled. Render nothing instead.
- **Don't** state the same number in prose and in a data component. One source.
- **Don't** add webfonts. System stacks paint first, with no layout shift.
- **Don't** let a fragment target sit under the sticky nav: reserve
  `scroll-margin-top`.
