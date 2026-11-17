// Refresh each repository independently; a failed download, export or record keeps its accepted snapshot.
import { resolve } from "node:path";
import process from "node:process";
import { parseCodemeta } from "./codemeta.mjs";
import {
  acquireMetadataLock,
  capture,
  generateMetadata,
  metadataRoot,
  publishMetadata,
  readJson,
} from "./metadata.mjs";
import { readCards } from "./projectCards.mjs";

await acquireMetadataLock();

const out = "src/data/codemeta.json";
const previous = await readJson(resolve(metadataRoot, out));
const provenance = await readJson(resolve(metadataRoot, "src/data/provenance.json"));
const files = {};
const raw = {};
const next = {};
const cards = process.env.METADATA_CARDS ? await readJson(process.env.METADATA_CARDS, []) : await readCards();
const refreshed = await Promise.all(
  cards.map(async ({ id, name, card }) => {
    const match = card.repo.match(/^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/?$/);
    if (!match) return;
    try {
      const base = process.env.CODEMETA_BASE_URL || "https://raw.githubusercontent.com";
      const url = `${base}/${match[1]}/HEAD/codemeta.json`;
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (response.status === 404 && !previous[card.repo]) return;
      if (!response.ok) throw new Error(`GET codemeta.json returned ${response.status}`);
      const source = await capture(response, `codemeta-${id}`, url);
      const metadata = parseCodemeta(source.parsed);
      const generated = await generateMetadata({ kind: "project", cardId: id, sources: [source] });
      return {
        repo: card.repo,
        generated,
        metadata: {
          ...metadata,
          fetched_at: source.retrievedAt.slice(0, 10),
          citation: generated.citation,
          sourceId: source.id,
        },
      };
    } catch (error) {
      console.log(`::warning::fetch-codemeta: ${name}: ${error.message}. Keeping its last metadata.`);
      if (previous[card.repo]) return { repo: card.repo, metadata: previous[card.repo] };
    }
  }),
);
for (const entry of refreshed.filter(Boolean)) {
  next[entry.repo] = entry.metadata;
  if (entry.generated) {
    Object.assign(provenance, entry.generated.provenance);
    Object.assign(files, entry.generated.files);
    Object.assign(raw, entry.generated.raw);
  }
}
files[out] = `${JSON.stringify(next, null, 2)}\n`;
files["src/data/provenance.json"] = `${JSON.stringify(provenance, null, 2)}\n`;
await publishMetadata(files, raw);
console.log(`fetch-codemeta: ${Object.keys(next).length} repositories`);
