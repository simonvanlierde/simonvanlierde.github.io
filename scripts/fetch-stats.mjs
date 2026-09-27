// Refreshes src/data/stats.json from the ReLab public API (`pnpm fetch:stats`).
// If the API is down or Cloudflare blocks a request, the script warns and exits 0
// without touching the committed snapshot, so the site keeps the last good figures.

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const out = resolve(import.meta.dirname, "../src/data/stats.json");

const base = (process.env.RELAB_API_URL || "https://api.cml-relab.org").replace(/\/$/, "");
const seriesUrl = `${base}/v1/stats/series?granularity=month`;
const totalsUrl = `${base}/v1/stats/totals`;

function skip(reason) {
  console.warn(`fetch-stats: ${reason}. Keeping existing src/data/stats.json.`);
  process.exit(0);
}

async function getJson(url) {
  let res;
  try {
    res = await fetch(url, { headers: { accept: "application/json" } });
  } catch (err) {
    skip(`request to ${url} failed: ${err.message}`);
  }
  if (!res.ok) skip(`GET ${url} returned ${res.status}`);
  if (!res.headers.get("content-type")?.includes("application/json")) {
    skip(`GET ${url} did not return JSON (likely a Cloudflare challenge)`);
  }
  return res.json();
}

const [seriesPayload, totalsPayload] = await Promise.all([getJson(seriesUrl), getJson(totalsUrl)]);

if (!Array.isArray(seriesPayload?.series) || seriesPayload.series.length === 0) {
  skip("series response had no rows");
}

// A renamed or dropped field would otherwise render as zeros.
const required = ["period", "teardowns", "parts", "mass_kg", "images", "users_new"];
// biome-ignore lint/suspicious/noEqualsToNull: == null intentionally matches null and undefined
if (seriesPayload.series.some((row) => required.some((k) => row?.[k] == null))) {
  skip(`a series row is missing one of: ${required.join(", ")}`);
}

// The hero prints these totals, so each must be a number.
const totalKeys = ["teardowns", "parts", "mass_kg", "images", "users"];
if (totalKeys.some((k) => typeof totalsPayload?.totals?.[k] !== "number")) {
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

// as_of is the API's count date (UTC, YYYY-MM-DD). If only the date would change,
// keep the old one, so the refresh workflow commits only when the counts move.
let previous = null;
try {
  previous = JSON.parse(await readFile(out, "utf8"));
} catch {
  // no committed snapshot yet
}
// Also drop the legacy `sample` flag.
const { as_of: previousAsOf, sample: _sample, ...previousRest } = previous ?? {};
const unchanged = previousAsOf && JSON.stringify(previousRest) === JSON.stringify(payload);
payload.as_of = unchanged ? previousAsOf : seriesPayload.generated_at.slice(0, 10);

await writeFile(out, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`fetch-stats: wrote ${payload.series.length} rows to src/data/stats.json`);
