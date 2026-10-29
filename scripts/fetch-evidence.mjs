// Refreshes the generated evidence files (`pnpm fetch:evidence`):
// - src/data/upstream.json: my merged PRs in other people's repos, from one GitHub search (needs GITHUB_TOKEN)
// - src/data/dois.json: concept and latest-version DOIs of the Zenodo records the pages and the CV link, from Zenodo
// - src/data/openalex.json: works under my ORCID, from OpenAlex (only scripts/evidence-drift.mjs reads it)
// Each source stands alone: if one fails, the script prints a ::warning::, keeps that file as it is and goes on.
// It always exits 0, so a failed fetch never fails the refresh workflow or the build.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import {
  parseOpenAlex,
  parseUpstream,
  parseZenodo,
  upstreamGraphql,
  upstreamQuery,
  withAsOf,
  zenodoIds,
} from "./evidence.mjs";

const root = resolve(import.meta.dirname, "..");
const today = new Date().toISOString().slice(0, 10);

async function getJson(url, init = {}) {
  // Zenodo answers 403 to Node's default user agent.
  const headers = { accept: "application/json", "user-agent": "simonvanlierde.com data refresh", ...init.headers };
  const request = `${init.method ?? "GET"} ${url}`;
  // A hung source would hold the job until its 10-minute timeout and lose the stats refresh too.
  const res = await fetch(url, { ...init, headers, signal: AbortSignal.timeout(30_000) }).catch((err) => {
    throw new Error(`${request} failed: ${err.message}`);
  });
  if (!res.ok) throw new Error(`${request} returned ${res.status}`);
  return res.json();
}

async function refresh(file, build) {
  const out = resolve(root, file);
  try {
    const payload = await build();
    const previous = await readFile(out, "utf8").then(JSON.parse, () => null);
    const next = withAsOf(previous, payload, today);
    await writeFile(out, `${JSON.stringify(next, null, 2)}\n`);
    console.log(`fetch-evidence: wrote ${file} (as of ${next.as_of})`);
  } catch (err) {
    // ::warning:: shows as an annotation on the workflow run.
    console.log(`::warning::fetch-evidence: ${err.message}. Keeping existing ${file}.`);
  }
}

await refresh("src/data/upstream.json", async () => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set (GitHub's GraphQL search needs one)");
  const body = await getJson("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ query: upstreamGraphql, variables: { q: upstreamQuery } }),
  });
  if (body.errors) throw new Error(`GitHub search failed: ${body.errors[0]?.message}`);
  return { prs: parseUpstream(body) };
});

await refresh("src/data/dois.json", async () => {
  const dir = resolve(root, "src/content/projects");
  const files = [
    resolve(root, "src/data/cv-public.yaml"),
    resolve(root, "src/pages/index.astro"),
    ...(await readdir(dir)).map((f) => resolve(dir, f)),
  ];
  const ids = zenodoIds((await Promise.all(files.map((f) => readFile(f, "utf8")))).join("\n"));
  const records = {};
  // One at a time: Zenodo allows about 130 requests a minute, and there are a handful.
  for (const id of ids.sort()) {
    records[id] = parseZenodo(await getJson(`https://zenodo.org/api/records/${id}/versions/latest`));
  }
  return { records };
});

await refresh("src/data/openalex.json", async () => {
  // A regex, not a YAML parser, so the workflow needs no dependency install.
  const cv = await readFile(resolve(root, "src/data/cv-public.yaml"), "utf8");
  const orcid = cv.match(/^\s+orcid: https:\/\/orcid\.org\/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])\s*$/m)?.[1];
  if (!orcid) throw new Error("no ORCID in src/data/cv-public.yaml basics.links.orcid");
  const url = `https://api.openalex.org/works?filter=author.orcid:${orcid}&per-page=200&select=doi,title,publication_year,type`;
  return { works: parseOpenAlex(await getJson(url)) };
});
