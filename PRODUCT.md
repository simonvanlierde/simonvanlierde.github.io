# Product

## Platform

web

## Users

People who judge or use open research software in industrial ecology and LCA: researchers deciding
whether to use, cite or build on a tool; users who arrive from a tool's README or DOI and want its
demo, source and citation; and collaborators deciding whether to work with me, who want the range of
the work and a way to reach me.

## Product Purpose

The site shows the open software and data infrastructure I build for industrial ecology, at CML,
Leiden University. A reader can inspect a working project, find its source and release metadata,
check my merged contributions to the field's tools, and read or download the CV. Success is a reader
who finds the right project in under 30 seconds and leaves with a link to run, cite or contact.

## Positioning

Open infrastructure for industrial ecology: the platform (R9lab), the tools and datasets around it,
and fixes merged into the libraries the field already relies on, each backed by a live demo, a DOI
or a merged PR.

## Operating Context

- Readers arrive from a tool's README, a DOI landing page, a paper, a talk, or a shared link with a
  social card. Many read on a phone.
- Project titles open the project's website when one exists; source links stay separate.

## Capabilities and Constraints

- Sheets: the index (R9lab and four featured projects: jsonvet, credit-matrix, ramascene-explorer
  and cv-ie-taxonomy, plus one line each for six upstream libraries, with Brightway's four
  repositories counted as one), the CV, the archive, and notes. A PhD sheet is in draft.
- Featured means selected for the index. Archive means outside that selection, not discontinued.
  The archive register groups the remaining projects by category and lists every merged upstream
  contribution.
- The register shows item, kind, stack and links. It omits year, role and maintenance status,
  because the project cards do not record them.
- Release versions, DOIs and licences come from each repo's cached CodeMeta record, not a second
  manual list.
- The CV keeps its dated experience history and exported PDF.
- Static site on GitHub Pages behind Cloudflare: no cookies, no analytics, no third-party scripts
  or fonts.

## Brand Commitments

- The lab is spelled "R9lab".
- The title block states no wanted role or availability.
- The portrait, its social card and the CV PDF are all rights reserved.

## Evidence on Hand

- The R9lab totals on the index are a dated snapshot of the live platform (`src/data/stats.json`,
  refreshed by a scheduled workflow). Historical totals in the CV keep the date of their claim.
- Every other figure names its source and date (`src/data/figures.ts`, each card's `figures`).
- Upstream contributions are real merged PRs (`src/data/upstream.ts`).
- No testimonials, users counts or citations beyond these exist. Don't invent them.

## Product Principles

1. Show the working thing: a demo, a DOI or a merged PR beats a description.
2. Every number is real and dated.
3. The field's own tools come first: upstream work is ranked by how widely the field uses each tool.
4. One fact lives in one place: metadata comes from the repos, not copied by hand.

## Accessibility & Inclusion

WCAG AA in both themes, checked by the axe suite in CI. Every interactive target is at least 44px.
Reduced motion drops all movement and shows the finished state.
