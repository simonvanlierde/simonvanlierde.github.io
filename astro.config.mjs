// @ts-check

import react from "@astrojs/react";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://simonvanlierde.github.io",
  base: "/",
  integrations: [react()],
  vite: {
    build: {
      // esbuild, not Lightning CSS. Lightning CSS rewrote `backdrop-filter` to
      // the `-webkit-` form *only*, dropping the standard property, which leaves
      // engines that implement just the standard one with no blur at all.
      cssMinify: "esbuild",
    },
  },
});
