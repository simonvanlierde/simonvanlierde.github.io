import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";
import { formatPeriod } from "../src/components/cvPeriod.ts";
import { listablePublications, PublicationSchema } from "../src/data/publications.ts";

// Read the export directly rather than restating its contents here: these tests
// assert that whatever the private repo exported is what the page renders, so a
// hard-coded section list would just be a second source of truth to update.
const cv = parse(readFileSync("src/data/cv-public.yaml", "utf8"));

// Publications are gated by more than presence: unaccepted work without a DOI is
// deliberately withheld. Reuse the real rule rather than restating it; which
// entries it selects is covered in tests/unit/publications.test.ts.
const publications = listablePublications((cv.publications ?? []).map((p: unknown) => PublicationSchema.parse(p)));

// Sections the site renders only when the export carries them, paired with the
// data that gates each one.
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
  // The h1 is the name: a print or screenshot of the page top has to say whose
  // CV this is. "CV" lives in the tab title and the URL.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Simon van Lierde");

  // The spine is required by the schema; a missing one is a broken export.
  for (const heading of ["Profile", "Experience", "Education"]) {
    await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
  }

  // An optional section appears exactly when it has content. A heading over an
  // empty list reads as a gap in the person, not a gap in the export.
  for (const [heading, items] of optionalSections) {
    await expect(page.getByRole("heading", { level: 2, name: heading })).toHaveCount(items.length > 0 ? 1 : 0);
  }
});

test("the page is dated from the export, machine-readably", async ({ page }) => {
  const stamp = page.locator(".cv-updated time");
  if (cv.exported) {
    // The visible text is human-facing; the datetime attribute has to stay the
    // exact exported instant so the date is not just a rendered string.
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

  // The export may deliberately withhold the address; the page must then carry
  // no mailto at all rather than a dead "mailto:undefined".
  const mailto = page.locator('a[href^="mailto:"]');
  if (cv.basics.email) {
    await expect(mailto.first()).toHaveAttribute("href", `mailto:${cv.basics.email}`);
  } else {
    await expect(mailto).toHaveCount(0);
  }
});

test("experience entries carry a role, an organisation, and a formatted period", async ({ page }) => {
  // The first exported job, whatever it is: the page must render it as the
  // export says, formatted the way the site formats every period.
  const [job] = cv.experience;
  const current = page.locator(".cv-entry").filter({ hasText: job.role });
  await expect(current.locator(".cv-entry__period")).toHaveText(formatPeriod(job.start, job.end));
  await expect(current.locator(".cv-entry__org")).toContainText(job.organization);
});

// The page and the PDF are exported together; a stale or missing export would
// otherwise ship a download button that 404s.
test("the download link resolves to a real PDF", async ({ page, request }) => {
  const link = page.getByRole("link", { name: "Download as PDF" }).first();
  await expect(link).toHaveAttribute("href", "/files/simon-van-lierde-cv.pdf");

  const response = await request.get("/files/simon-van-lierde-cv.pdf");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/pdf");
});

test("the homepage links to the CV, and the CV links back", async ({ page }) => {
  // Reduced motion here turns off the cross-document view transition (see the
  // @view-transition rule in global.css, which honours it). Headless Chromium
  // suspends rendering for the duration of the transition, so Playwright's
  // "element is stable" check never resolves and the second click times out.
  // A real browser settles with no pending animations; this is a harness quirk,
  // not a defect, and every other assertion here is unaffected.
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.getByRole("link", { name: "Home" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page
    .getByRole("navigation")
    .getByRole("link", { name: /Sheet 2/ })
    .click();
  await expect(page).toHaveURL(/\/cv\/$/);
});

// The structured data has no on-page symptom, so a leak (an email the page
// withholds, a publication the reader is not shown) would ship unnoticed. Parse
// the script and hold it to the same gates as the visible page.
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

// The history lives on /cv/ alone. If the homepage ever grows a copy of the
// timeline, that copy is a second source of truth and this test fails.
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

  // This sheet is generated, so it is dated rather than merely attributed.
  await expect(block.getByText("Dated", { exact: true })).toBeVisible();
  const stamp = block.locator("time");
  await expect(stamp).toHaveAttribute("datetime", cv.exported.slice(0, 10));
  // The stamp reads in UTC; a local-zone build must not shift it by a day.
  await expect(stamp).toHaveText(new RegExp(String(Number(cv.exported.slice(8, 10)))));

  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Sheet 2: CV" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Sheet 1: Index" })).not.toHaveAttribute("aria-current", "page");
});
