// Refreshes src/data/upstream.json (`pnpm fetch:evidence`): my merged PRs in other people's repos, from one
// GitHub search (needs GITHUB_TOKEN). If the fetch fails, the script prints a ::warning::, keeps the file as it
// is and exits 0, so a failed fetch never fails the refresh workflow or the build.

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { parseUpstream, upstreamGraphql, upstreamQuery, withAsOf } from "./evidence.mjs";

const out = resolve(import.meta.dirname, "../src/data/upstream.json");
const url = "https://api.github.com/graphql";

try {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set (GitHub's GraphQL search needs one)");
  const res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ query: upstreamGraphql, variables: { q: upstreamQuery } }),
    // A hung request would hold the job until its 10-minute timeout.
    signal: AbortSignal.timeout(30_000),
  }).catch((err) => {
    throw new Error(`POST ${url} failed: ${err.message}`);
  });
  if (!res.ok) throw new Error(`POST ${url} returned ${res.status}`);
  const body = await res.json();
  if (body.errors) throw new Error(`GitHub search failed: ${body.errors[0]?.message}`);
  const previous = await readFile(out, "utf8").then(JSON.parse, () => null);
  const next = withAsOf(previous, { prs: parseUpstream(body) }, new Date().toISOString().slice(0, 10));
  await writeFile(out, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`fetch-evidence: wrote src/data/upstream.json (as of ${next.as_of})`);
} catch (err) {
  // ::warning:: shows as an annotation on the workflow run.
  console.log(`::warning::fetch-evidence: ${err.message}. Keeping existing src/data/upstream.json.`);
}
