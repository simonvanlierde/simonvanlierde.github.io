import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";
import { formatPeriod } from "../src/components/cvPeriod.ts";
import { listablePublications, PublicationSchema } from "../src/data/publications.ts";

// Read the export instead of hard-coding it, so the tests check the page against
// whatever was exported.
const cv = parse(readFileSync("src/data/cv-public.yaml", "utf8"));

// Reuse the real listing rule; tests/unit/publications.test.ts covers what it selects.
const publications = listablePublications((cv.publications ?? []).map((p: unknown) => PublicationSchema.parse(p)));

// Optional sections, each paired with the data that gates it.
const optionalSections: [string, unknown[]][] = [
  ["Publications", publications],
  ["Skills", cv.skills ?? []],
  ["Projects", cv.projects ?? []],
  ["Talks and training", cv.professional_development ?? []],
  ["Interests", cv.interests ?? []],
];

test.beforeEach(async ({ page }) => {
  await page.goto("/cv/");
});

test("renders every CV section the export carries, and no empty ones", async ({ page }) => {
  await expect(page).toHaveTitle(/CV \| Simon van Lierde/);
  // The h1 is the name, so a print or screenshot says whose CV it is.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Simon van Lierde");

  // The schema requires these sections.
  for (const heading of ["Profile", "Experience", "Education"]) {
    await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
  }

  // An optional section renders only when it has content, never as an empty heading.
  for (const [heading, items] of optionalSections) {
    await expect(page.getByRole("heading", { level: 2, name: heading })).toHaveCount(items.length > 0 ? 1 : 0);
  }
});

test("the page is dated from the export, machine-readably", async ({ page }) => {
  const stamp = page.locator(".cv-updated time");
  if (cv.exported) {
    // datetime must be the exact exported instant, not the rendered text.
    await expect(stamp).toHaveAttribute("datetime", cv.exported);
    await expect(stamp).toHaveText(
      new Date(cv.exported).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    );
  } else {
    await expect(stamp).toHaveCount(0);
  }
});

test("contact details render only what the export publishes", async ({ page }) => {
  const contact = page.locator(".cv-contact");
  await expect(contact).toContainText(cv.basics.location);

  // Without an exported address, the page must carry no mailto at all.
  const mailto = page.locator('a[href^="mailto:"]');
  if (cv.basics.email) {
    await expect(mailto.first()).toHaveAttribute("href", `mailto:${cv.basics.email}`);
  } else {
    await expect(mailto).toHaveCount(0);
  }
});

test("experience entries carry a role, an organisation, and a formatted period", async ({ page }) => {
  const [job] = cv.experience;
  const current = page.locator(".cv-entry").filter({ hasText: job.role });
  await expect(current.locator(".cv-entry__period")).toHaveText(formatPeriod(job.start, job.end));
  await expect(current.locator(".cv-entry__org")).toContainText(job.organization);
});

// A missing PDF export would ship a download button that 404s.
test("the download link resolves to a real PDF", async ({ page, request }) => {
  const link = page.getByRole("link", { name: "Download as PDF" }).first();
  await expect(link).toHaveAttribute("href", "/files/simon-van-lierde-cv.pdf");

  const response = await request.get("/files/simon-van-lierde-cv.pdf");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/pdf");
});

test("the homepage links to the CV, and the CV links back", async ({ page }) => {
  // Reduced motion disables the cross-document view transition. Headless Chromium
  // suspends rendering during it, so the second click times out. A harness quirk only.
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.getByRole("link", { name: "Home" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page
    .getByRole("navigation")
    .getByRole("link", { name: /Sheet 2/ })
    .click();
  await expect(page).toHaveURL(/\/cv\/$/);
});

// A leak in structured data has no visible symptom, so hold it to the page's gates.
for (const path of ["/", "/cv/"]) {
  test(`structured data on ${path} claims only what the page shows`, async ({ page }) => {
    await page.goto(path);
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    const data = JSON.parse(raw ?? "null");
    expect(data?.["@context"]).toBe("https://schema.org");

    const nodes: Record<string, unknown>[] = data["@graph"] ?? [data];
    const person = nodes.find((n) => n["@type"] === "Person");
    expect(person?.name).toBe(cv.basics.name);
    expect(person?.email).toBe(cv.basics.email ? `mailto:${cv.basics.email}` : undefined);

    const articles = nodes.filter((n) => n["@type"] === "ScholarlyArticle").map((n) => n.headline);
    expect(articles).toEqual(path === "/cv/" ? publications.map((pub) => pub.title) : []);
  });
}

// The timeline lives only on /cv/; a homepage copy would be a second source of truth.
test("the homepage does not restate the CV timeline", async ({ page }) => {
  await expect(page.locator(".cv-entry")).not.toHaveCount(0);

  await page.goto("/");
  await expect(page.locator(".cv-entry")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2, name: /Experience|Education/ })).toHaveCount(0);
});

test("the CV sheet stamps when its data was exported, and marks itself current", async ({ page }) => {
  const block = page.getByRole("region", { name: "Document title block" });
  await expect(block.getByText("Curriculum vitae", { exact: true })).toBeVisible();
  await expect(block.getByText("2 OF 2", { exact: true })).toBeVisible();

  // A generated sheet is dated, not attributed.
  await expect(block.getByText("Dated", { exact: true })).toBeVisible();
  const stamp = block.locator("time");
  await expect(stamp).toHaveAttribute("datetime", cv.exported.slice(0, 10));
  // The stamp is UTC; a local-zone build must not shift the day.
  await expect(stamp).toHaveText(new RegExp(String(Number(cv.exported.slice(8, 10)))));

  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Sheet 2: CV" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Sheet 1: Index" })).not.toHaveAttribute("aria-current", "page");
});
