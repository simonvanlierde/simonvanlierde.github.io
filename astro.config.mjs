// @ts-check

import preact from "@astrojs/preact";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://simonvanlierde.github.io",
  base: "/",
  // Preact, not React: the one island needs two hooks, not a 57KB runtime.
  integrations: [preact()],
});
