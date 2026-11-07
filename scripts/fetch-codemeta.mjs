// Refreshes each card's CodeMeta snapshot. Failed requests keep that repository's last good entry.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "yaml";
import { parseCodemeta } from "./codemeta.mjs";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, "src/data/codemeta.json");
const previous = await readFile(out, "utf8").then(JSON.parse, () => ({}));
const next = {};
const today = new Date().toISOString().slice(0, 10);
const cardsDir = resolve(root, "src/content/projects");
for (const name of (await readdir(cardsDir)).filter((file) => file.endsWith(".md")).sort()) {
  const card = parse((await readFile(resolve(cardsDir, name), "utf8")).split(/^---$/m)[1]);
  const match = card.repo.match(/^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/?$/);
  if (!match) continue;
  try {
    const response = await fetch(`https://raw.githubusercontent.com/${match[1]}/HEAD/codemeta.json`, {
      signal: AbortSignal.timeout(30_000),
    });
    if (response.status === 404 && !previous[card.repo]) continue;
    if (!response.ok) throw new Error(`GET codemeta.json returned ${response.status}`);
    next[card.repo] = { ...parseCodemeta(await response.json()), fetched_at: today };
  } catch (error) {
    console.log(`::warning::fetch-codemeta: ${name}: ${error.message}. Keeping its last metadata.`);
    if (previous[card.repo]) next[card.repo] = previous[card.repo];
  }
}
await writeFile(out, `${JSON.stringify(next, null, 2)}\n`);
console.log(`fetch-codemeta: ${Object.keys(next).length} repositories`);
