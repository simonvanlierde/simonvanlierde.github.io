# simonvanlierde.github.io

[![CI](https://github.com/simonvanlierde/simonvanlierde.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/simonvanlierde/simonvanlierde.github.io/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/simonvanlierde/simonvanlierde.github.io/branch/main/graph/badge.svg)](https://codecov.io/gh/simonvanlierde/simonvanlierde.github.io)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fsimonvanlierde.com)](https://simonvanlierde.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Personal website for Simon van Lierde, research software engineer and PhD candidate at CML, Leiden
University. It has two pages, a landing page for my work and a CV. I build it with Astro and deploy
it to GitHub Pages at [simonvanlierde.com](https://simonvanlierde.com).

The site is drawn as one ISO technical drawing set, with a chart of R9lab's disassembly data that refreshes weekly.

## Local development

This project uses [pnpm](https://pnpm.io).

```sh
pnpm install      # install dependencies
pnpm dev          # start the dev server at http://localhost:4321
pnpm build        # type-check (astro check) and build to dist/
pnpm gen:og       # regenerate public/og.png (the social-card image)
pnpm fetch:cards  # copy each card's demo og:image into src/assets/cards/
pnpm check        # lint + typecheck + unit tests
pnpm test:e2e     # playwright: axe a11y + behaviour, against the built site (pnpm build first)
```

Every pull request and push to `main` runs `pnpm check` and `pnpm test:e2e`.

## More

- [docs/architecture.md](docs/architecture.md): how the site is built, where the CV and chart data
  come from, the checks, and the deploy
- [DESIGN.md](DESIGN.md): the design system
- [docs/accessibility.md](docs/accessibility.md): the accessibility statement and what the checks cover

## Licence and credits

MIT, see [LICENSE](LICENSE); [REUSE.toml](REUSE.toml) gives each file's license. Display and
data lettering use a vendored [osifont](https://github.com/hikikomori82/osifont) subset
(ISO 3098, LGPL+FE), see [public/fonts/osifont-LICENSE.txt](public/fonts/osifont-LICENSE.txt).
The Code of Conduct is the Contributor Covenant (CC-BY-SA-4.0). My portrait (also in the social card) and the CV PDF
are all rights reserved.

To report a bug, see [CONTRIBUTING](.github/CONTRIBUTING.md); for a vulnerability,
[SECURITY](.github/SECURITY.md).
