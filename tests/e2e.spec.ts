import { expect, test } from "@playwright/test";

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
  const toggle = page.getByRole("button", { name: "Toggle dark mode" });

  await toggle.click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
});

test("the upstream-fixes disclosure is collapsed then expands", async ({ page }) => {
  // Personal projects now ships open; upstream fixes is the disclosure that
  // starts collapsed, so it carries the collapse/expand coverage.
  const details = page.locator("details.disclosure:not(.personal)");
  await expect(details).toHaveJSProperty("open", false);
  await details.locator("summary").click();
  await expect(details).toHaveJSProperty("open", true);
});

test("the visually-hidden data table mirrors the plotted series", async ({ page }) => {
  // The table is the chart's accessible fallback; if it drifts from the bars,
  // assistive-tech users silently get a different dataset than sighted users.
  const rows = page.locator("table tbody tr");
  const bars = page.locator("rect.chart__bar");
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
});
