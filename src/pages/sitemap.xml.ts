import { getCollection } from "astro:content";
import { isoDay } from "../components/cvPeriod.ts";
import { cv } from "../data/cv.ts";
import { indexDated } from "../data/figures.ts";
import { site } from "../data/projectSchema.ts";
import stats from "../data/stats.json" with { type: "json" };

// All sheets and notes, plus the project sites other repos publish under this domain
// through their own GitHub Pages. Those carry no lastmod: this build cannot
// know when they last changed.
const notes = await getCollection("notes");
const latestNote = notes
  .map((n) => n.data.date)
  .sort()
  .at(-1);
const exported = cv.exported ? isoDay(cv.exported) : undefined;
const featured = (await getCollection("projects")).filter((p) => p.data.featured);
const pages: { path: string; lastmod?: string }[] = [
  { path: "/", lastmod: indexDated(exported, stats.as_of, featured) },
  { path: "/cv/", lastmod: exported },
  { path: "/archive/", lastmod: exported },
  { path: "/notes/", lastmod: latestNote },
  { path: "/privacy/" },
  ...notes.map((note) => ({ path: `/notes/${note.id}/`, lastmod: note.data.date })),
  ...[
    "jsonvet",
    "citesync",
    "codemeta-drift",
    "sourceledger",
    "ramascene-explorer",
    "cv-ie-taxonomy",
    "msc-thesis-ie",
    "io-notebook",
    "brightway-benchmarks",
  ].map((repo) => ({ path: `/${repo}/` })),
];

export const GET = () =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(({ path, lastmod }) => `  <url><loc>${site}${path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`)
  .join("\n")}
</urlset>
`,
    { headers: { "Content-Type": "application/xml" } },
  );
