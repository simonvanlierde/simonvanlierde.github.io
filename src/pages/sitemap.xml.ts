import { isoDay } from "../components/cvPeriod.ts";
import { cv } from "../data/cv.ts";
import { site } from "../data/projectSchema.ts";
import stats from "../data/stats.json" with { type: "json" };

// Both sheets, plus the project sites other repos publish under this domain
// through their own GitHub Pages. Those carry no lastmod: this build cannot
// know when they last changed.
const exported = cv.exported ? isoDay(cv.exported) : undefined;
const pages: { path: string; lastmod?: string }[] = [
  // The index dates itself by the newer of the CV export and the R9lab stats.
  { path: "/", lastmod: [exported, stats.as_of].filter(Boolean).sort().at(-1) },
  { path: "/cv/", lastmod: exported },
  ...[
    "jsonvet",
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
