// The project cards' frontmatter, for the refresh scripts, which run outside Astro's content layer.
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "yaml";

const cardsDir = resolve(import.meta.dirname, "../src/content/projects");

/** Every card in src/content/projects as { id, name, card }, sorted by file name. */
export async function readCards() {
  const names = (await readdir(cardsDir)).filter((file) => file.endsWith(".md")).sort();
  return Promise.all(
    names.map(async (name) => ({
      id: name.slice(0, -3),
      name,
      card: parse((await readFile(resolve(cardsDir, name), "utf8")).split(/^---$/m)[1]),
    })),
  );
}
