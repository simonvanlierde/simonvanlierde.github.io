import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";
import { isDuinlabApp } from "../src/data/projectSchema.ts";

// duinlab.nl redirects to /duinlab/, so every card with a duinlab.nl demo must be listed there.
const demos = readdirSync("src/content/projects")
  .map((f) => parse(readFileSync(`src/content/projects/${f}`, "utf8").split("---")[1]).demo as string | undefined)
  .filter(isDuinlabApp);

test("the duinlab page lists every app with a duinlab.nl demo", async ({ page }) => {
  expect(demos.length).toBeGreaterThanOrEqual(6);
  await page.goto("/duinlab/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("duinlab");
  const links = await page
    .locator("#apps-heading ~ table tbody th > a")
    .evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href.replace(/\/$/, "")));
  expect(links.sort()).toEqual(demos.map((d) => d?.replace(/\/$/, "")).sort());
});

test("the sitemap lists the duinlab page", async ({ request }) => {
  expect(await (await request.get("/sitemap.xml")).text()).toContain("<loc>https://simonvanlierde.com/duinlab/</loc>");
});
