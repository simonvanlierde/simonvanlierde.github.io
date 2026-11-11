# Product

## Platform

web

## Users

- **Primary:** a hiring manager or research software engineering (RSE) group lead deciding whether to
  talk to me. They skim for about ten seconds, thirty at most, often from a link in an application or
  a talk, and want to see that I build real, connected tools that people in the field use.
- Researchers in industrial ecology and LCA deciding whether to use, cite or build on a tool. They
  arrive from a README, a DOI landing page or a paper and want its demo, source and citation.
- Collaborators who want the range of the work and a way to reach me.
- People who use one of my small web apps and arrive from duinlab.nl.

## Product Purpose

The site shows the whole body of open software and data I build: the infrastructure for industrial
ecology at CML, Leiden University, the tools and datasets around it, the fixes merged into the
libraries the field relies on, and my small web apps. Success is a reader who understands within
seconds what I build and how it connects, opens one working project, and leaves with a link to run,
cite or contact.

## Positioning

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
- The work is a dependency graph. Each project has a `layer` (upstream libraries, data, software,
  tools and apps) and lists what it `uses`; "used by" is derived. Threads are curated stories across
  projects (PhD, environmental footprints, trustworthy research software, ML and computer vision,
  speed and reliability, local-first apps), each with its own URL.
- Clusters group projects that belong together: R9lab's parts, the apps (with the duinlab apps
  inside), and small utilities. Repos with copier level `minimal` sit in utilities and stay off the CV.
- A project page carries what the data already holds: description, real figures, demo or install,
  CodeMeta facts (version, licence, DOI, citation), related notes. Flagships may add a longer story.
- Release versions, DOIs and licences come from each repo's cached CodeMeta record; levels from each
  repo's public copier answers. Nothing from the private planning repo (mode, rank, reasons for
  leaving a repo off the CV) enters this repo.
- The CV keeps its dated experience history and exported PDF.
- Links other sites already hold keep working: `/#project-<id>`, `/archive/#project-<id>`, `/cv/`,
  `/notes/<slug>/`, `/duinlab/`.
- Static site built with Astro on GitHub Pages behind Cloudflare. Interactive parts are islands:
  Preact today, Svelte from the redesign on. No cookies, no analytics, no third-party scripts or fonts.

## Brand Commitments

- The lab is spelled "R9lab".
- Wanted role and availability appear in one place only: the contact section at the end of home
  (agreed 2026-11-11). The old rule kept them out of the drawing set's title block.
- The portrait, its social card and the CV PDF are all rights reserved.

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

## Accessibility & Inclusion

WCAG AA in both themes, checked by the axe suite in CI, including interactive states. Any visual of
the work has a text equivalent that is the real content. Targets are at least 24px, 44px where the
layout allows. Reduced motion shows the composed, still state; short colour fades stay.
