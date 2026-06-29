// Refreshes src/data/stats.json from the RELab /stats endpoint.
// Run with: pnpm fetch:stats  (a scheduled workflow runs it and commits changes)
//
// The endpoint is public but fronted by Cloudflare; if a request is blocked or
// the API is down, this script logs a warning and exits 0 WITHOUT touching the
// committed snapshot, so the last good figures stay on the site and CI is green.

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const out = resolve(import.meta.dirname, "../src/data/stats.json");

const base = (process.env.RELAB_API_URL || "https://api.cml-relab.org").replace(/\/$/, "");
const url = `${base}/stats?granularity=month`;

// Bail out gracefully: warn, leave the snapshot untouched, succeed.
function skip(reason) {
  console.warn(`fetch-stats: ${reason}. Keeping existing src/data/stats.json.`);
  process.exit(0);
}

let payload;
try {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) skip(`GET ${url} returned ${res.status}`);
  if (!res.headers.get("content-type")?.includes("application/json")) {
    skip(`GET ${url} did not return JSON (likely a Cloudflare challenge)`);
  }
  payload = await res.json();
} catch (err) {
  skip(`request failed: ${err.message}`);
}

if (!Array.isArray(payload?.series) || payload.series.length === 0) {
  skip("response had no series rows");
}

// Every row must carry the fields the chart reads; a shape drift (renamed or
// dropped field) would otherwise render as silent zeros. Keep the last good snapshot instead.
const required = ["period", "label", "teardowns", "parts", "mass_kg", "images", "users"];
if (payload.series.some((row) => required.some((k) => row?.[k] == null))) {
  skip(`a series row is missing one of: ${required.join(", ")}`);
}

// Drop the sample flag — these are real figures now.
delete payload.sample;

await writeFile(out, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`fetch-stats: wrote ${payload.series.length} rows to src/data/stats.json`);
