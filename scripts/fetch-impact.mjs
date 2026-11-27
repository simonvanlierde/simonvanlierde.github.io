// Each card repository's latest run record per kind, from impact.jsonl on its orphan `impact` branch.
// A 404 means the repository has no records; any other failure keeps its last good entry.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { latestRecords } from "./impact.mjs";
import { readCards } from "./projectCards.mjs";

const out = resolve(import.meta.dirname, "../src/data/impact.json");
const previous = JSON.parse(await readFile(out, "utf8").catch(() => "{}"));
const cards = await readCards();
const refreshed = await Promise.all(
  cards.map(async ({ name, card }) => {
    const match = card.repo?.match(/^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/?$/);
    if (!match) return;
    try {
      const url = `https://raw.githubusercontent.com/${match[1]}/impact/impact.jsonl`;
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (response.status === 404) return;
      if (!response.ok) throw new Error(`GET impact.jsonl returned ${response.status}`);
      const records = latestRecords(await response.text(), (problem) =>
        console.log(`::warning::fetch-impact: ${name}: skipped ${problem}`),
      );
      if (Object.keys(records).length) return [card.repo, records];
    } catch (error) {
      console.log(`::warning::fetch-impact: ${name}: ${error.message}. Keeping its last records.`);
      if (previous[card.repo]) return [card.repo, previous[card.repo]];
    }
  }),
);
const next = Object.fromEntries(refreshed.filter(Boolean));
await writeFile(out, `${JSON.stringify(next, null, 2)}\n`);
console.log(`fetch-impact: ${Object.keys(next).length} repositories with records`);
