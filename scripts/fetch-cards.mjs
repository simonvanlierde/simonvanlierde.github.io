// Refreshes the card close-ups (`pnpm fetch:cards`): for each featured card with a demo, cuts a close-up from the
// demo page's social card (og:image) at the card's `image_focus`, writes it to src/assets/cards/<id>.png and records
// it in src/data/cardImages.json. An entry marked `"manual": true` is a hand-made close-up: it is kept as it is and
// never fetched. A card whose fetch fails keeps its last good entry, with a ::warning::; a page with no og:image
// drops its entry.

import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { parse } from "yaml";
import { CLOSE_UP_ASPECT, closeUp, parseSocialCard } from "./cards.mjs";

const root = resolve(import.meta.dirname, "..");
const cardsDir = resolve(root, "src/content/projects");
const assetsDir = resolve(root, "src/assets/cards");
const out = resolve(root, "src/data/cardImages.json");
// Twice the close-up's 15rem (240px) on the card, for sharp screens.
const width = 480;

const get = (url) =>
  fetch(url, { signal: AbortSignal.timeout(30_000) }).then((res) => {
    if (!res.ok) throw new Error(`GET ${url} returned ${res.status}`);
    return res;
  });

const previous = await readFile(out, "utf8").then(JSON.parse, () => ({}));
const next = {};
const today = new Date().toISOString().slice(0, 10);

for (const name of (await readdir(cardsDir)).filter((f) => f.endsWith(".md")).sort()) {
  const id = name.slice(0, -3);
  const card = parse((await readFile(resolve(cardsDir, name), "utf8")).split(/^---$/m)[1]);
  if (!card.demo || !card.featured) continue;
  if (previous[id]?.manual) {
    next[id] = previous[id];
    continue;
  }
  try {
    // Resolve against the URL after redirects: a demo without its trailing slash moves ./og.png up a level.
    const page = await get(card.demo);
    const source = parseSocialCard(await page.text(), page.url);
    if (!source) continue;
    const image = sharp(Buffer.from(await (await get(source)).arrayBuffer()));
    const region = closeUp(await image.metadata(), card.image_focus);
    const file = `${id}.png`;
    if (previous[id] && previous[id].file !== file) await rm(resolve(assetsDir, previous[id].file), { force: true });
    await image
      .extract(region)
      .resize(width, Math.round(width / CLOSE_UP_ASPECT))
      .png()
      .toFile(resolve(assetsDir, file));
    next[id] = { file, source, fetched_at: today };
  } catch (err) {
    console.log(`::warning::fetch-cards: ${id}: ${err.message}. Keeping its last image.`);
    if (previous[id]) next[id] = previous[id];
  }
}

for (const [id, entry] of Object.entries(previous)) {
  if (!next[id]) await rm(resolve(assetsDir, entry.file), { force: true });
}
await writeFile(out, `${JSON.stringify(next, null, 2)}\n`);
console.log(`fetch-cards: ${Object.keys(next).length} card images (${Object.keys(next).join(", ")})`);
