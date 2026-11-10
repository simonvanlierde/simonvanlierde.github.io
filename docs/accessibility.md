# Accessibility statement

This statement covers [simonvanlierde.com](https://simonvanlierde.com): the index of
work (`/`), the CV (`/cv/`), the project archive (`/archive/`), the notes (`/notes/`), the privacy
page, the 404 page and the CV PDF. It was last reviewed on 10 November 2026.

## Target

The site aims to meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA. WCAG 2.2 is also the
level the European standard EN 301 549 (v4.1.1) adopts.

## What is checked on every change

Every pull request and every push to `main` runs these checks:

- **axe-core in a real browser** (`tests/a11y.spec.ts`). Playwright runs axe on every page, a note included, in
  the light and the dark colour scheme, on the home page, the CV, the archive and a note at phone width, and again after folding a list, switching the
  chart's measure and toggling the theme. The scan uses the WCAG 2.0, 2.1 and 2.2 A and AA rules
  plus axe's best-practice rules. Any violation fails the run.
- **Behaviour tests** (`tests/e2e.spec.ts`): the skip link is the first tab stop, the theme
  toggle keeps its choice, and the chart's buttons report their state with `aria-pressed`.
- **Biome's a11y lint rules**: missing `alt` text, misused ARIA, and click handlers with no keyboard
  equivalent.

## What the site does

- The page language is set, and a skip link leads past the navigation.
- Links and buttons are sized to 44 by 44 CSS pixels where the layout allows (WCAG 2.2 AA asks
  for 24), and show a visible focus ring.
- Both colour schemes are checked for contrast. The site opens dark and remembers a choice made with
  the toggle.
- When the system asks for reduced motion, nothing moves: no smooth scrolling, no page transitions
  and no animated drawing or chart. The finished state shows at once.
- The R9lab chart has a visually hidden table with the same numbers, so its data does not depend on
  reading the SVG.
- The CV PDF is a tagged PDF that claims PDF/UA-1 (accessible) and PDF/A-2a (archivable). The build
  of the PDF checks both claims.

## Known limits

- axe cannot work out the background behind SVG text, so it reports the chart's axis labels as
  "needs review" rather than pass or fail. Their colours come from the same tokens as the checked
  text.
- Automated checks find only part of what WCAG asks for. Keyboard paths and screen reader output
  are not part of the checks.
- Pages I link to, such as GitHub, the live demos and Zenodo, are outside this statement.

## Feedback

If something on the site is hard to use, email me at
[simonvanlierde@gmail.com](mailto:simonvanlierde@gmail.com) or
[open an issue](https://github.com/simonvanlierde/simonvanlierde.github.io/issues). I aim to reply
within a week.
