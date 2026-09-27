import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

// Tests the built site: run `pnpm build` first (CI does).
export default defineConfig({
  testDir: "./tests",
  // tests/unit/ runs under `node --test`, not Playwright.
  testIgnore: "unit/**",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://127.0.0.1:4321" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // --ignore-lock keeps preview in the foreground. Astro backgrounds it under an
    // AI agent, and Playwright reads that as an early exit.
    command: "astro preview --port 4321 --host 127.0.0.1 --ignore-lock",
    url: "http://127.0.0.1:4321",
    // A stray `astro dev` on 4321 would serve dev output; fail on the busy port instead.
    reuseExistingServer: false,
  },
});
