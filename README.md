# simonvanlierde.github.io

[![CI](https://github.com/simonvanlierde/simonvanlierde.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/simonvanlierde/simonvanlierde.github.io/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/simonvanlierde/simonvanlierde.github.io/branch/main/graph/badge.svg)](https://codecov.io/gh/simonvanlierde/simonvanlierde.github.io)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fsimonvanlierde.com)](https://simonvanlierde.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Personal website for Simon van Lierde, research software engineer and PhD candidate at CML, Leiden
University. It has four sheets: selected work, a CV, a project archive and technical notes (with an RSS feed at `/notes/rss.xml`), plus a privacy page. I build it with Astro and deploy
it to GitHub Pages at [simonvanlierde.com](https://simonvanlierde.com).

The site is drawn as one ISO technical drawing set, with a chart of R9lab's disassembly data that refreshes weekly.

## Local development

This project needs Node 26 and [pnpm](https://pnpm.io).

```sh
pnpm install      # install dependencies
pnpm dev          # start the dev server at http://localhost:4321
pnpm build        # type-check (astro check) and build to dist/
pnpm gen:og       # regenerate public/og.png (the social-card image)
pnpm fetch:cards  # copy each featured card's demo og:image into src/assets/cards/
pnpm fetch:codemeta # refresh project metadata, citation downloads and source records
pnpm fetch:stats  # refresh R9lab figures and source records
pnpm gen:citation # regenerate CITATION.cff from the package and public CV
pnpm fetch:evidence # refresh merged upstream PRs in src/data/upstream.json
pnpm gen:card     # a poster social card (name, line, address, an app icon via `--mark` above the name and/or a proof visual via `--visual` in the right panel) for another site (needs Docker); run it bare for its flags
                  # the visual is one element captured at 3x and cropped tight, or the app icon: a whole screen is unreadable in the panel
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
The technical notes in `src/content/notes/` are CC-BY-4.0. The Code of Conduct is the Contributor Covenant (CC-BY-SA-4.0). My portrait (also in the social card) and the CV PDF
are all rights reserved.

To report a bug, see [CONTRIBUTING](.github/CONTRIBUTING.md); for a vulnerability,
[SECURITY](.github/SECURITY.md).

## Citations and source records

Metadata refreshes need [uv](https://docs.astral.sh/uv/) and Python 3.13 or newer. The
locked script environment pins citesync and sourceledger to source commits; no global tool
installation is needed. `pnpm dev` and `pnpm build` use committed snapshots and need
neither Python nor network access.

`pnpm fetch:codemeta` downloads each project's CodeMeta, then runs citesync's public
CLI to generate APA, BibTeX, CSL-JSON and schema.org JSON-LD under `public/citations/`.
Before generating exports or source records, citesync requires a name, author and
licence in each downloaded file. Version and DOI stay optional.
The card's metadata index links to these files. Missing upstream CodeMeta stays
missing; the site supplies no authors, dates, DOIs or licences for it. Download,
validation, export or provenance failures keep that project's last accepted files.
`pnpm fetch:stats` accepts R9lab's series and totals together, keeping both previous
source records when either response fails.

sourceledger records the original HTTP response bytes before JSON parsing. Its
canonical records live in `public/provenance/`; `src/data/provenance.json` is a derived
index for the site. Each record gives the source URL, actual retrieval time and
SHA-256. A changed hash means the downloaded bytes changed, including whitespace;
it does not establish that the source's claims changed or are correct.

Raw response bodies stay in ignored `.cache/sources/<source-id>/<sha256>` for local
audit. They are never included in the site build, committed or uploaded as public
artifacts. A fresh checkout has the record history but no raw bodies: hashes alone
cannot reconstruct earlier downloads. Raw bodies fetched by CI are ephemeral and leave
with its runner. The record history is evidence of retrieval, not a permanent archive.

`pnpm gen:citation` generates the site's own `CITATION.cff` with citesync, using the
package's name, description and version and the public CV's author and ORCID.
CI regenerates it and checks for drift before the build. The weekly refresh updates
it with the other committed artifacts; the static build serves it at `/CITATION.cff`.

Refresh commands share a lock in `.cache/metadata-refresh.lock`. A second command
exits 3 without changing accepted data; retry after the first finishes. Normal exit,
Ctrl-C and SIGTERM release the lock. After a forced kill or host crash, verify that
no refresh is running before removing the empty lock directory with
`rmdir .cache/metadata-refresh.lock`.
