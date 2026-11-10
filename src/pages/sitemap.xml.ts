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
const projects = await getCollection("projects");
const featured = projects.filter((p) => p.data.featured);
// A card whose demo lives under this domain is one of those project sites.
const subsites = projects
  .map((p) => p.data.demo)
  .filter((demo) => demo?.startsWith(`${site}/`))
  .map((demo) => new URL(demo ?? "").pathname)
  .sort();
const pages: { path: string; lastmod?: string }[] = [
  { path: "/", lastmod: indexDated(exported, stats.as_of, featured) },
  { path: "/cv/", lastmod: exported },
  { path: "/archive/", lastmod: exported },
  { path: "/notes/", lastmod: latestNote },
  { path: "/privacy/" },
  ...notes.map((note) => ({ path: `/notes/${note.id}/`, lastmod: note.data.date })),
  ...subsites.map((path) => ({ path })),
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
