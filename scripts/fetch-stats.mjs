// Refreshes src/data/stats.json from the RELab public API.
// Run with: pnpm fetch:stats  (a scheduled workflow runs it and commits changes)
//
// Two endpoints, /v1/stats/series and /v1/stats/totals, are folded into the one
// snapshot the site reads. The API is public but fronted by Cloudflare; if a
// request is blocked or the API is down, this script logs a warning and exits 0
// WITHOUT touching the committed snapshot, so the last good figures stay on the
// site and CI is green.

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const out = resolve(import.meta.dirname, "../src/data/stats.json");

const base = (process.env.RELAB_API_URL || "https://api.cml-relab.org").replace(/\/$/, "");
const seriesUrl = `${base}/v1/stats/series?granularity=month`;
const totalsUrl = `${base}/v1/stats/totals`;

// Bail out gracefully: warn, leave the snapshot untouched, succeed.
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

// Every row must carry the fields the chart reads; a shape drift (renamed or
// dropped field) would otherwise render as silent zeros. Keep the last good snapshot instead.
const required = ["period", "teardowns", "parts", "mass_kg", "images", "users_new"];
// biome-ignore lint/suspicious/noEqualsToNull: == null intentionally matches null and undefined
if (seriesPayload.series.some((row) => required.some((k) => row?.[k] == null))) {
  skip(`a series row is missing one of: ${required.join(", ")}`);
}

// The hero notes print the running totals as counted figures, so they must
// be present and numeric, not silently absent.
const totalKeys = ["teardowns", "parts", "mass_kg", "images", "users"];
if (totalKeys.some((k) => typeof totalsPayload?.totals?.[k] !== "number")) {
  skip(`totals is missing one of: ${totalKeys.join(", ")}`);
}

const granularity = seriesPayload.granularity ?? "month";

// The API omits periods with no activity. Bars are evenly spaced, so a missing
// month would read as a month that never happened: fill the gaps with zeros.
// Month periods only ("YYYY-MM"); any other granularity passes through as sent.
const monthLabel = (period) => {
  const [year, month] = period.split("-").map(Number);
  return `${new Date(Date.UTC(year, month - 1)).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })} ${year}`;
};

function fillMonthGaps(rows) {
  if (granularity !== "month" || rows.some((r) => !/^\d{4}-\d{2}$/.test(r.period))) return rows;
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

// Months at the edges with no teardown are kept rather than trimmed: they carry
// sign-ups, and the window reads as the lab's whole run, not just its busy part.
const sorted = [...seriesPayload.series].sort((a, b) => a.period.localeCompare(b.period));

const payload = {
  granularity,
  series: fillMonthGaps(sorted).map((row) => ({
    period: row.period,
    label: granularity === "month" ? monthLabel(row.period) : row.period,
    teardowns: row.teardowns,
    parts: row.parts,
    mass_kg: row.mass_kg,
    images: row.images,
    // "New members" in the chart; the API also reports users_active, unused here.
    users: row.users_new,
  })),
  // `products` is the site's word for a teardown: one product taken apart.
  totals: { ...totalsPayload.totals, products: totalsPayload.totals.teardowns },
};

// When the figures were counted, per the API's own stamp; ISO YYYY-MM-DD in UTC,
// same as the CV export stamp. If nothing but the date would change, keep the
// previous date: the label says when the counts last moved, and the workflow's
// no-change guard stays useful.
let previous = null;
try {
  previous = JSON.parse(await readFile(out, "utf8"));
} catch {
  // no committed snapshot yet
}
// `sample` is dropped along with it: these are real figures now.
const { as_of: previousAsOf, sample: _sample, ...previousRest } = previous ?? {};
const unchanged = previousAsOf && JSON.stringify(previousRest) === JSON.stringify(payload);
payload.as_of = unchanged ? previousAsOf : seriesPayload.generated_at.slice(0, 10);

await writeFile(out, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`fetch-stats: wrote ${payload.series.length} rows to src/data/stats.json`);
