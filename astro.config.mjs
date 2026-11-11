// @ts-check

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import process from "node:process";
import preact from "@astrojs/preact";
import { defineConfig } from "astro/config";

// The commit this build came from, for the title block's "Site rev". Actions sets
// GITHUB_SHA; a local build asks git. A build without git (a tarball, a container)
// still builds, and the title block then links the repo instead.
function buildSha() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}
const sha = buildSha();
// Platforms cache a preview by image URL, so the card URL carries the PNG's hash.
const ogVersion = createHash("sha256").update(readFileSync("public/og.png")).digest("hex").slice(0, 8);

// https://astro.build/config
export default defineConfig({
  site: "https://simonvanlierde.com",
  base: "/",
  // Preact, not React: the one island needs two hooks, not a 57KB runtime.
  integrations: [preact()],
  // Fenced code: both themes' colours land as CSS variables, and global.css picks one by colour-scheme.
  // The high-contrast pair clears 4.5:1 on --surface in both themes.
  markdown: {
    shikiConfig: {
      themes: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" },
      defaultColor: false,
    },
  },
  vite: {
    define: {
      "import.meta.env.SITE_SHA": JSON.stringify(sha),
      "import.meta.env.OG_VERSION": JSON.stringify(ogVersion),
    },
  },
});
