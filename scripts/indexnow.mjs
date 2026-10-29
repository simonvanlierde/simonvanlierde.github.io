// Tells search engines which pages changed in a deploy (IndexNow, https://www.indexnow.org).
// Reads the changed file names from stdin, one per line (`git diff --name-only <before> HEAD`),
// and posts the affected page URLs. A failed ping prints a ::warning:: and exits 0.

import { readFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";

const host = "simonvanlierde.com";
// The key is public by design: the same text is served at keyLocation.
const key = "446172ef13f18ca026df280659b33daa";
const endpoint = "https://api.indexnow.org/indexnow";
const home = `https://${host}/`;
const cv = `https://${host}/cv/`;

// Files that change one page only. The 404 page is not worth indexing.
const only = {
  "src/pages/index.astro": [home],
  "src/pages/cv.astro": [cv],
  "src/pages/404.astro": [],
};
// Only these paths can change the built pages.
const affectsSite = (file) =>
  /^(src|public)\//.test(file) || /^(package\.json|pnpm-lock\.yaml|astro\.config\.)/.test(file);

/** The page URLs whose HTML can differ after a change to `files`. */
export function changedUrls(files) {
  const urls = new Set();
  for (const file of files) {
    if (file in only) for (const url of only[file]) urls.add(url);
    // Shared layouts, components, styles, data and assets feed both pages.
    else if (affectsSite(file) && file !== `public/${key}.txt`) urls.add(home).add(cv);
  }
  return [...urls];
}

export function buildPayload(urlList) {
  return { host, key, keyLocation: `https://${host}/${key}.txt`, urlList };
}

/**
 * Posts the payload. Returns an error message, or "" on success.
 * @param {object} payload
 * @param {(url: string, init: { method: string, headers: object, body: string }) => Promise<{ ok: boolean, status: number }>} doFetch
 */
export async function send(payload, doFetch = fetch) {
  try {
    const res = await doFetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
    return res.ok ? "" : `IndexNow returned ${res.status}`;
  } catch (err) {
    return `request failed: ${err.message}`;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = readFileSync(0, "utf8").split("\n").filter(Boolean);
  const urls = changedUrls(files);
  if (urls.length === 0) {
    console.log("indexnow: no page changed, nothing to ping.");
  } else {
    const error = await send(buildPayload(urls));
    // ::warning:: shows as an annotation on the workflow run.
    if (error) console.log(`::warning::indexnow: ${error}. The deploy is unaffected.`);
    else console.log(`indexnow: pinged ${urls.join(", ")}`);
  }
}
