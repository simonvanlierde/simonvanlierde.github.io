# Product

## Platform

web

## Users

- **Primary:** research software engineers and group leads who want to see what I build and how it
  connects. They skim for about ten seconds, thirty at most, often from a link in a talk or a paper,
  and want to see real, connected tools that people in the field use.
- Researchers in industrial ecology and LCA deciding whether to use, cite or build on a tool. They
  arrive from a README, a DOI landing page or a paper and want its demo, source and citation.
- Collaborators who want the range of the work and a way to reach me.
- People who use one of my small web apps and arrive from duinlab.nl.

## Product Purpose

The site shows the open tools and data I contribute to industrial ecology and the circular economy,
drawn as the system they belong to: where the data comes from, what it builds on, and who uses it
downstream. Success is a reader who sees within seconds what I contribute and how it connects, then
uses, checks, cites or adds to one piece of it, or gets in touch.

## Positioning

Mission, the line under my name: "I contribute open tools and data to industrial ecology and the
circular economy, for anyone to use, check and add to."

Open infrastructure for industrial ecology, shown as the connected system it is: the platform
(R9lab), the tools and datasets built on the field's libraries, and fixes merged into those
libraries, each backed by a live demo, a DOI or a merged PR.

## Operating Context

- Readers arrive from a tool's README, a DOI landing page, a paper, a talk, a job application, or a
  shared link with a social card. Many read on a phone.
- Project titles open the project's website when one exists; source links stay separate.
- duinlab.nl will redirect to `/duinlab/`, so that URL is public.
- Nine project sites are other repos' GitHub Pages served under this domain (`/jsonvet/` and others);
  the sitemap lists them and the site must not shadow their paths.

## Capabilities and Constraints

- Content: a home page with the work, one page per project, curated threads through the work, the
  CV, technical notes, a `/duinlab/` list, and a privacy page.
- Most notes open with a paragraph that works alone as a LinkedIn or Bluesky post and links back to
  the note. Reference write-ups may skip it.
- The work is drawn as a metabolism: the physical world it reads from, the field's libraries, my
  projects by `layer` (data, software, tools and apps), and the people who use them. Each project
  lists what it `builds_on` (drawn) and its `tooling` (project pages only); "used by" is derived.
  `extracts` names the part of the physical world a project draws data from, `serves` who uses it
  downstream now, and `could_serve` who it could serve next (drawn faint and dashed). The people are
  five roles: researchers and students, research software builders, policy and planning,
  circular-economy practitioners, and the public. Threads are curated stories across projects (circular data economy, footprints and
  flows, open and fair research software, open and reproducible machine learning, tools that respect
  people, built to scale and last), each with its own URL.
- Groupings come from facts, not a hand-set field: R9lab's parts from its own card, the duinlab apps
  from a demo host ending in `.duinlab.nl`, and utilities from copier level `minimal`. Utilities stay
  off the CV.
- A project page carries what the data already holds: description, real figures, demo or install,
  CodeMeta facts (version, licence, DOI, citation), related notes. Flagships may add a longer story.
- Release versions, DOIs and licences come from each repo's cached CodeMeta record; levels from each
  repo's public copier answers. Nothing from the private planning repo (mode, rank, reasons for
  leaving a repo off the CV) enters this repo.
- The CV keeps its dated experience history and exported PDF.
- Links other sites already hold keep working: `/cv/`, `/notes/<slug>/`, `/duinlab/`. The old
  `/archive/` and `/#project-<id>` anchors are not redirected; the 404 page points to the project.
- Static site built with Astro on GitHub Pages behind Cloudflare. Interactive parts are islands:
  Preact today, Svelte from the redesign on. No cookies, no analytics, no third-party scripts or fonts.

## Brand Commitments

- The lab is spelled "R9lab".
- Wanted role and availability appear in one place only: the contact section at the end of home
  (agreed 2026-11-11). The old rule kept them out of the drawing set's title block.
- The portrait, its social card and the CV PDF are all rights reserved.
- The vision lives on the about page. Other pages link to it rather than restate it.

## Evidence on Hand

- The R9lab totals are a dated snapshot of the live platform (`src/data/stats.json`, refreshed by a
  scheduled workflow). Historical totals in the CV keep the date of their claim.
- Every other figure names its source and date (`src/data/figures.ts`, each card's `figures`).
- Upstream contributions are real merged PRs (`src/data/upstream.ts`).
- The portrait (`public/portrait.jpg`).
- No testimonials, user counts or citations beyond these exist. Don't invent them.

## Product Principles

1. Show the working thing: a demo, a DOI or a merged PR beats a description.
2. Show how the work connects: every project sits in the graph with what it uses and what uses it.
3. Every number is real and dated.
4. The field's own tools come first: upstream work is ranked by how widely the field uses each tool.
5. One fact lives in one place: metadata comes from the repos, not copied by hand.
6. Three depths: a ten-second glance, a one-minute skim, and a dig for whoever wants it. Nothing
   in a deeper layer is needed to read the layer above, and each deeper layer is one click away.

## Accessibility & Inclusion

WCAG AA in both themes, checked by the axe suite in CI, including interactive states. Any visual of
the work has a text equivalent that is the real content. Targets are at least 24px, 44px where the
layout allows. Reduced motion shows the composed, still state; short colour fades stay.
