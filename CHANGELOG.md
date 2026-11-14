# Changelog

Changes a visitor would notice. The site deploys from `main` after every merge, and a version tag
marks a point worth naming. Versions before 0.5.0 are described in the
[GitHub releases](https://github.com/simonvanlierde/simonvanlierde.github.io/releases). The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Downloadable project citations in APA, BibTeX, CSL-JSON and JSON-LD, plus the site's own citation file.
- Source records for project metadata and R9lab figures, showing retrieval dates, checksums and changed downloads. See [citations and source records](README.md#citations-and-source-records).

### Fixed

- Project metadata refreshes keep the last accepted citation and source record when
  an upstream file loses its name, author or licence. See [citations and source records](README.md#citations-and-source-records).

## [0.5.0] - 2026-11-10

### Added

- A notes section with an RSS feed, starting with a note on the shared monitoring for CML's research software.
- An archive that lists every project, grouped into research tools, personal apps and smaller projects.
- A privacy page, linked from the footer.
- A portrait in a title zone shared by the index and the CV.
- Featured projects lead the work list after R9lab: credit-matrix, ramascene-explorer, cv-ie-taxonomy and jsonvet, each with a close-up of its demo.
- Project cards show each demo's social card and sourced figures, link their titles to the project's website, and link to the cards they use.
- Cards for citesync and io-notebook.
- A section on merged work in the open-source libraries the field runs on, ordered by how widely each is used and refreshed weekly.
- The CV lists talks, and on desktop shows its section register beside the title zone.
- Search engines get structured data for the profile, each project and each publication, plus a sitemap and robots.txt. Each deploy pings IndexNow.
- R9lab's row links its DOI and OpenSSF pages, and the jsonvet card links its benchmark history.

### Changed

- The site moved to [simonvanlierde.com](https://simonvanlierde.com).
- The index and CV lead with "research software engineer".
- The navigation fits five sheets, and on phones shows the sheet names alone.
- Code in notes follows the light and dark theme.
- Both project lists open by default and show their counts only when closed.
- The citesync card links to its browser playground.
- The msc-thesis-ie dataset is listed under CC-BY-4.0, the license of its Zenodo record.

### Fixed

- The CV's export date is the same UTC day on every page.
- The index is dated by its newest figure, not only by the CV export and the R9lab counts.
- A link reached with the keyboard is no longer hidden under the sticky navigation.
- Screen readers and voice control get the visible "+N" on a card's extra links.
- Without JavaScript the theme toggle is hidden, since it cannot work.
- Search engines hear about an edited note and the privacy page.
- Crawlers stay off the ramascene-explorer data files.

[Unreleased]: https://github.com/simonvanlierde/simonvanlierde.github.io/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/simonvanlierde/simonvanlierde.github.io/compare/v0.4.0...v0.5.0
