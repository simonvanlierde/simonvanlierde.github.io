import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";
import stats from "../src/data/stats.json" with { type: "json" };

// The export decides which hero link is primary, so read it rather than restate
// it. See tests/cv.spec.ts for the same reasoning.
const cv = parse(readFileSync("src/data/cv-public.yaml", "utf8"));

// The landing page only plots the series once the stats export is real: sample
// figures next to real counts would be worse than no chart. So the chart specs
// below skip themselves while `sample` is set and come back automatically the
// first time scripts/fetch-stats.mjs writes live data.
const statsAreSample = stats.sample === true;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("renders the page shell: title, main landmark, single h1", async ({ page }) => {
  await expect(page).toHaveTitle(/Simon van Lierde/);
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Simon van Lierde");
});

test("hero profile links point at the right destinations", async ({ page }) => {
  const banner = page.getByRole("banner");
  const expected: Record<string, string> = {
    GitHub: "https://github.com/simonvanlierde",
    LinkedIn: "https://www.linkedin.com/in/simon-van-lierde/",
    ORCID: "https://orcid.org/0009-0006-6953-909X",
    "Leiden profile": "https://www.universiteitleiden.nl/en/staffmembers/simon-van-lierde",
  };
  for (const [name, href] of Object.entries(expected)) {
    await expect(banner.getByRole("link", { name })).toHaveAttribute("href", href);
  }
});

test("skip link is the first tab stop and targets main", async ({ page }) => {
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toHaveAttribute("href", "#main");
});

test("theme toggle flips the theme and persists across reload", async ({ page }) => {
  const html = page.locator("html");
  const toggle = page.getByRole("button", { name: "Dark mode" });

  await toggle.click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
});

test("the personal-projects disclosure expands then collapses", async ({ page }) => {
  // Personal projects ships closed: it is secondary to the work above it, and
  // it is the only disclosure, so it carries the expand/collapse coverage.
  const details = page.locator("details.disclosure.personal");
  await expect(details).toHaveJSProperty("open", false);
  await details.locator("summary").click();
  await expect(details).toHaveJSProperty("open", true);
  await details.locator("summary").click();
  await expect(details).toHaveJSProperty("open", false);
});

test("the hero has exactly one stamp", async ({ page }) => {
  // Every other hero link is a way to look Simon up. The stamp is the one that
  // asks for something back, and the sheet grammar allows exactly one in the
  // header: mailto when the export publishes an address, the CV when it doesn't.
  const primary = page.locator("header .stamp");
  await expect(primary).toHaveCount(1);
  await expect(primary).toHaveAttribute("href", cv.basics.email ? `mailto:${cv.basics.email}` : "/cv/");
});

test("an unknown path serves the 404 page with a way back", async ({ page }) => {
  await page.goto("/no-such-page/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("That page does not exist");
  await expect(page.getByRole("link", { name: "Sheet 1: index of work" })).toHaveAttribute("href", "/");
});

if (statsAreSample) {
  test("no chart is rendered while the stats export is sample data", async ({ page }) => {
    await expect(page.locator('svg[role="img"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Teardowns" })).toHaveCount(0);
  });
} else {
  test("the visually-hidden data table mirrors the plotted series", async ({ page }) => {
    // The table is the chart's accessible fallback; if it drifts from the bars,
    // assistive-tech users silently get a different dataset than sighted users.
    const rows = page.locator("table tbody tr");
    const bars = page.locator("path.chart__bar");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    await expect(bars).toHaveCount(rowCount);

    // Caption names the active measure and tracks the toggle.
    const caption = page.locator("table caption");
    await expect(caption).toHaveText(/Teardowns/i);

    const parts = page.getByRole("button", { name: "Parts" });
    await expect(async () => {
      await parts.click();
      await expect(parts).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
    }).toPass();
    await expect(caption).toHaveText(/Parts/i);
  });

  test("chart measure toggle updates pressed state and the accessible summary", async ({ page }) => {
    const chart = page.locator('svg[role="img"]');
    await expect(chart).toHaveAttribute("aria-label", /teardowns/i);

    const parts = page.getByRole("button", { name: "Parts" });
    // client:visible island: retry the click until hydration has attached the
    // handler (aria-pressed is server-rendered, so it can't gate hydration).
    await expect(async () => {
      await parts.click();
      await expect(parts).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
    }).toPass();

    await expect(chart).toHaveAttribute("aria-label", /parts/i);
    await expect(page.getByRole("button", { name: "Teardowns" })).toHaveAttribute("aria-pressed", "false");

    // Without the live region the switch is silent to a screen reader: the label
    // and the table both change off-screen with nothing announcing it.
    await expect(page.locator("[aria-live=polite]")).toHaveText(/^Parts: /);
  });
}
