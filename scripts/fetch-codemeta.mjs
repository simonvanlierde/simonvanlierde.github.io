// Refreshes each card's CodeMeta snapshot. Failed requests keep that repository's last good entry.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseCodemeta } from "./codemeta.mjs";
import { readCards } from "./projectCards.mjs";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, "src/data/codemeta.json");
const previous = await readFile(out, "utf8").then(JSON.parse, () => ({}));
const today = new Date().toISOString().slice(0, 10);
const entries = await Promise.all(
  (await readCards()).map(async ({ name, card }) => {
    const match = card.repo.match(/^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/?$/);
    if (!match) return;
    try {
      const response = await fetch(`https://raw.githubusercontent.com/${match[1]}/HEAD/codemeta.json`, {
        signal: AbortSignal.timeout(30_000),
      });
      if (response.status === 404 && !previous[card.repo]) return;
      if (!response.ok) throw new Error(`GET codemeta.json returned ${response.status}`);
      return [card.repo, { ...parseCodemeta(await response.json()), fetched_at: today }];
    } catch (error) {
      console.log(`::warning::fetch-codemeta: ${name}: ${error.message}. Keeping its last metadata.`);
      if (previous[card.repo]) return [card.repo, previous[card.repo]];
    }
  }),
);
const next = Object.fromEntries(entries.filter(Boolean));
await writeFile(out, `${JSON.stringify(next, null, 2)}\n`);
console.log(`fetch-codemeta: ${Object.keys(next).length} repositories`);
