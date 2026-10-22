// @ts-check

import { execFileSync } from "node:child_process";
import process from "node:process";
import preact from "@astrojs/preact";
import { defineConfig } from "astro/config";

// The commit this build came from, for the title block's "Site rev". Actions sets
// GITHUB_SHA; a local build asks git.
const sha = process.env.GITHUB_SHA ?? execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();

// https://astro.build/config
export default defineConfig({
  site: "https://simonvanlierde.github.io",
  base: "/",
  // Preact, not React: the one island needs two hooks, not a 57KB runtime.
  integrations: [preact()],
  vite: { define: { "import.meta.env.SITE_SHA": JSON.stringify(sha) } },
});
