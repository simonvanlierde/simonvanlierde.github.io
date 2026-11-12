// Refreshes src/data/stats.json from the R9lab public API (`pnpm fetch:stats`).
// If the API is down or Cloudflare blocks a request, the script prints a ::warning:: and exits 0
// without touching the committed snapshot, so the site keeps the last good figures.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { withAsOf } from "./evidence.mjs";
import {
  acquireMetadataLock,
  capture,
  generateMetadata,
  metadataRoot,
  publishMetadata,
  readJson,
} from "./metadata.mjs";

await acquireMetadataLock();

// STATS_OUT is for the tests.
const out = process.env.STATS_OUT || resolve(import.meta.dirname, "../src/data/stats.json");

const base = (process.env.R9LAB_API_URL || "https://api.r9lab.io").replace(/\/$/, "");
const seriesUrl = `${base}/v1/stats/series?granularity=month`;
const totalsUrl = `${base}/v1/stats/totals`;

function skip(reason) {
  // ::warning:: shows as an annotation on the workflow run.
  console.log(`::warning::fetch-stats: ${reason}. Keeping existing src/data/stats.json.`);
  process.exit(0);
}

async function getJson(url, id) {
  let res;
  try {
    // A hung API would hold the job until its 10-minute timeout.
    res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
  } catch (err) {
    skip(`request to ${url} failed: ${err.message}`);
  }
  if (!res.ok) skip(`GET ${url} returned ${res.status}`);
  if (!res.headers.get("content-type")?.includes("application/json")) {
    skip(`GET ${url} did not return JSON (likely a Cloudflare challenge)`);
  }
  try {
    return await capture(res, id, url);
  } catch (err) {
    skip(`GET ${url} returned invalid JSON: ${err.message}`);
  }
}

const sources = await Promise.all([getJson(seriesUrl, "r9lab-series"), getJson(totalsUrl, "r9lab-totals")]);
const [seriesPayload, totalsPayload] = sources.map((source) => source.parsed);

if (!Array.isArray(seriesPayload?.series) || seriesPayload.series.length === 0) {
  skip("series response had no rows");
}

if (typeof seriesPayload.generated_at !== "string") skip("series response had no generated_at date");

// A renamed or dropped field would otherwise render as zeros.
const required = ["period", "teardowns", "parts", "mass_kg", "images", "users_new"];
// The gap filler walks months until it meets the last period, so a period in any other
// form would never match and loop forever.
const counts = required.slice(1);
const validRow = (row) => /^\d{4}-(0[1-9]|1[0-2])$/.test(row?.period) && counts.every((k) => Number.isFinite(row[k]));
if (!seriesPayload.series.every(validRow)) {
  skip(`a series row needs a YYYY-MM period and numbers for: ${counts.join(", ")}`);
}

// The hero prints these totals, so each must be a number.
const totalKeys = ["teardowns", "parts", "mass_kg", "images", "users"];
if (totalKeys.some((k) => !Number.isFinite(totalsPayload?.totals?.[k]))) {
  skip(`totals is missing one of: ${totalKeys.join(", ")}`);
}

// The API omits idle months. Bars are evenly spaced, so fill the gaps with zeros.
const monthLabel = (period) => {
  const [year, month] = period.split("-").map(Number);
  return `${new Date(Date.UTC(year, month - 1)).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })} ${year}`;
};

function fillMonthGaps(rows) {
  const byPeriod = new Map(rows.map((r) => [r.period, r]));
  const [firstYear, firstMonth] = rows[0].period.split("-").map(Number);
  const last = rows[rows.length - 1].period;
  const filled = [];
  for (const d = new Date(Date.UTC(firstYear, firstMonth - 1)); ; d.setUTCMonth(d.getUTCMonth() + 1)) {
    const period = d.toISOString().slice(0, 7);
    filled.push(byPeriod.get(period) ?? { period, teardowns: 0, parts: 0, mass_kg: 0, images: 0, users_new: 0 });
    if (period === last) break;
  }
  return filled;
}

// Keep idle months at the edges: they still carry sign-ups. The chart skips the
// idle lead-in itself.
const sorted = [...seriesPayload.series].sort((a, b) => a.period.localeCompare(b.period));

const payload = {
  series: fillMonthGaps(sorted).map((row) => ({
    period: row.period,
    label: monthLabel(row.period),
    teardowns: row.teardowns,
    parts: row.parts,
    mass_kg: row.mass_kg,
    images: row.images,
    // Sign-ups ("Accounts" in the chart).
    users: row.users_new,
  })),
  totals: totalsPayload.totals,
};

// as_of is the API's count date (UTC, YYYY-MM-DD), kept while the counts stay the same.
const previous = await readFile(out, "utf8").then(JSON.parse, () => null);
const today = new Date().toISOString().slice(0, 10);
const next = withAsOf(previous, payload, today, seriesPayload.generated_at.slice(0, 10));

try {
  const generated = await generateMetadata({ kind: "stats", sources });
  const provenance = await readJson(resolve(metadataRoot, "src/data/provenance.json"));
  Object.assign(provenance, generated.provenance);
  // STATS_OUT stays available for isolated tests, with provenance rooted at METADATA_ROOT.
  const snapshot = out.startsWith(`${metadataRoot}/`) ? out.slice(metadataRoot.length + 1) : null;
  if (!snapshot) throw new Error("STATS_OUT must be within METADATA_ROOT");
  await publishMetadata(
    {
      ...generated.files,
      [snapshot]: `${JSON.stringify(next, null, 2)}\n`,
      "src/data/provenance.json": `${JSON.stringify(provenance, null, 2)}\n`,
    },
    generated.raw,
  );
} catch (error) {
  skip(`provenance failed: ${error.message}`);
}
console.log(`fetch-stats: wrote ${next.series.length} rows to src/data/stats.json`);
