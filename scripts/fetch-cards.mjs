// Refreshes the card images (`pnpm fetch:cards`): for each work or personal card with a demo, copies the demo
// page's social card (og:image) to src/assets/cards/<id>.<ext> and records it in src/data/cardImages.json. A card
// whose fetch fails keeps its last good entry, with a ::warning::; a page with no og:image drops its entry.

import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { parseSocialCard } from "./cards.mjs";

const root = resolve(import.meta.dirname, "..");
const cardsDir = resolve(root, "src/content/projects");
const assetsDir = resolve(root, "src/assets/cards");
const out = resolve(root, "src/data/cardImages.json");
const types = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp" };

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
  const frontmatter = await readFile(resolve(cardsDir, name), "utf8");
  const demo = frontmatter.match(/^demo: (.+)$/m)?.[1].trim();
  if (!demo || /^category: minor$/m.test(frontmatter)) continue;
  try {
    // Resolve against the URL after redirects: a demo without its trailing slash moves ./og.png up a level.
    const page = await get(demo);
    const card = parseSocialCard(await page.text(), page.url);
    if (!card) continue;
    const image = await get(card.url);
    const ext = types[image.headers.get("content-type")?.split(";")[0] ?? ""] ?? extname(new URL(card.url).pathname);
    if (!Object.values(types).includes(ext)) throw new Error(`${card.url} is not a PNG, JPEG or WebP image`);
    const file = `${id}${ext}`;
    if (previous[id] && previous[id].file !== file) await rm(resolve(assetsDir, previous[id].file), { force: true });
    await writeFile(resolve(assetsDir, file), Buffer.from(await image.arrayBuffer()));
    next[id] = { file, alt: card.alt, source: card.url, fetched_at: today };
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
