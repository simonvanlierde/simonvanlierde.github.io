import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

// Accessibility gate only: drive the built site in headless Chromium and run
// axe against it. Playwright starts `astro preview` itself (webServer), so no
// separate server-orchestration dependency is needed. Requires a prior build
// (dist/); CI builds before this step, locally run `pnpm build` first.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://127.0.0.1:4321" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "astro preview --port 4321 --host 127.0.0.1",
    url: "http://127.0.0.1:4321",
    // Never adopt whatever already answers on 4321: a stray `astro dev` there
    // serves DEV-gated output (the sample chart among it) and the suite would
    // pass against a page visitors never see. Playwright starts its own
    // preview or fails on the busy port, which is the signal you want.
    reuseExistingServer: false,
  },
});
