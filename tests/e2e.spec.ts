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
const statsAreSample = (stats as { sample?: boolean }).sample === true;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("renders the page shell: title, main landmark, single h1", async ({ page }) => {
  await expect(page).toHaveTitle(/Simon van Lierde/);
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Simon van Lierde");
});

// The drawn sheet frame and the exploded view both reach outside their boxes at
// small widths; a page must never grow a horizontal scrollbar because of them.
for (const width of [320, 390, 900, 1200]) {
  test(`no page scrolls sideways at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ["/", "/cv/", "/no-such-page/"]) {
      await page.goto(path);
      const [scrollWidth, clientWidth] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(scrollWidth, `${path} at ${width}px`).toBeLessThanOrEqual(clientWidth);
    }
  });
}

test("the title block's contact links point at the right destinations", async ({ page }) => {
  const footer = page.getByRole("contentinfo");
  // GitHub and LinkedIn come from the export; ORCID and the Leiden page have
  // no export field yet and are kept by hand in the title block and here.
  const expected: Record<string, string> = {
    GitHub: cv.basics.links.github,
    LinkedIn: cv.basics.links.linkedin,
    ORCID: "https://orcid.org/0009-0006-6953-909X",
    "Leiden profile": "https://www.universiteitleiden.nl/en/staffmembers/simon-van-lierde",
  };
  for (const [name, href] of Object.entries(expected)) {
    await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  }
});

test("skip link is the first tab stop and lands before the h1", async ({ page }) => {
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toHaveAttribute("href", "#main");
  // Only the sheet nav is chrome; the h1 and the primary stamp are content and
  // must sit inside the skip target, not before it.
  await expect(page.locator("#main").getByRole("heading", { level: 1 })).toHaveCount(1);
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

test("the hero has exactly one stamp, and it is the CV", async ({ page }) => {
  // The sheet grammar allows one stamp in the header, and it is the CV: a
  // hiring reader wants to read before writing. The address, when the export
  // publishes one, sits beside it as a plain link whose text is the address.
  const primary = page.locator("header .stamp");
  await expect(primary).toHaveCount(1);
  await expect(primary).toHaveAttribute("href", "/cv/");
  const email = page.locator("header a[href^='mailto:']");
  if (cv.basics.email) {
    await expect(email).toHaveAttribute("href", `mailto:${cv.basics.email}`);
    await expect(email).toHaveText(cv.basics.email);
  } else {
    await expect(email).toHaveCount(0);
  }
});

test("the exploded view becomes one compact, touch-sized system on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await expect(page.getByText("Open any numbered part.")).toBeVisible();
  await expect(page.locator(".exploded__svg--desktop")).toBeHidden();
  const mobile = page.locator(".exploded__svg--mobile");
  await expect(mobile).toBeVisible();

  const links = mobile.locator("a.mobile-part");
  await expect(links).toHaveCount(6);
  for (let i = 0; i < 6; i += 1) {
    const box = await links.nth(i).boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }

  await page.setViewportSize({ width: 900, height: 800 });
  await expect(page.locator(".exploded__svg--desktop")).toBeVisible();
  await expect(mobile).toBeHidden();
});

// The plate is hand-drawn SVG: each balloon's href is written out at its own
// coordinates, so a copy-paste between parts is the likely mistake. Restated
// here on purpose, as the second source of truth the drawing lacks.
const PART_DESTINATIONS = [
  ["Camera rig", "https://github.com/CMLPlatform/relab-rpi-cam-plugin"],
  ["Capture app", "https://github.com/CMLPlatform/relab"],
  ["Web app", "https://app.cml-relab.org"],
  ["API", "https://github.com/CMLPlatform/relab"],
  ["Database", "https://github.com/CMLPlatform/relab"],
  ["Docs", "https://docs.cml-relab.org"],
];

for (const [variant, width] of [
  ["desktop", 900],
  ["mobile", 390],
] as const) {
  test(`every numbered part on the ${variant} plate opens its own destination`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const links = page.locator(`.exploded__svg--${variant} a`);
    await expect(links).toHaveCount(PART_DESTINATIONS.length);

    for (const [i, [name, href]] of PART_DESTINATIONS.entries()) {
      await expect(links.nth(i)).toHaveAttribute("href", href);
      // The label carries the part's identity; a swapped balloon shows up here.
      await expect(links.nth(i)).toHaveAttribute("aria-label", new RegExp(`^${name}:`));
    }
  });
}

test("a keyboard user can focus each part of the figure", async ({ page }) => {
  const first = page.locator(".exploded__svg--desktop a").first();
  await first.focus();
  await expect(first).toBeFocused();
  // The ring is what a sighted keyboard user locates the part by.
  await expect(first).toHaveCSS("outline-style", "solid");
});

test("without motion the drawing starts exploded and never assembles", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // The settle is the one animation here; reduced motion must skip it entirely
  // rather than run it faster, or the parts sit collapsed on first paint.
  await expect(page.locator(".exploded")).not.toHaveClass(/is-assembled/);
});

test("the title block states what the sheet is, and when it was drawn", async ({ page }) => {
  const block = page.getByRole("region", { name: "Document title block" });
  await expect(block.getByText("Simon van Lierde", { exact: true })).toBeVisible();
  await expect(block.getByText("Index of work", { exact: true })).toBeVisible();
  await expect(block.getByText("1 OF 2", { exact: true })).toBeVisible();

  // Both sheets are generated, so both are dated. The stamp is the export
  // date in UTC; a local-zone build must not shift it by a day.
  await expect(block.getByText("Dated", { exact: true })).toBeVisible();
  await expect(block.locator("time")).toHaveAttribute("datetime", cv.exported.slice(0, 10));

  const rev = block.getByRole("link", { name: /^Site version / });
  await expect(rev).toHaveAttribute("href", "https://github.com/simonvanlierde/simonvanlierde.github.io");
  await expect(rev).toHaveText(/^v\d+\.\d+\.\d+/);
});

test("a sheet with nothing generated is attributed rather than dated", async ({ page }) => {
  // The 404 is the only sheet without an export behind it, so it is the only
  // one that takes the title block's "Drawn by" fallback.
  await page.goto("/no-such-page/");
  const block = page.getByRole("region", { name: "Document title block" });
  await expect(block.getByText("Drawn by", { exact: true })).toBeVisible();
  await expect(block.getByText("SVL", { exact: true })).toBeVisible();
  await expect(block.locator("time")).toHaveCount(0);
  await expect(block.getByText("— OF 2", { exact: true })).toBeVisible();
});

test("the open sheet is marked current in the nav", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Sheet 1: Index" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Sheet 2: CV" })).not.toHaveAttribute("aria-current", "page");
});

test("the title block ends with a clear collaboration path", async ({ page }) => {
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByText("Contact Simon")).toBeVisible();
  if (cv.basics.email) {
    await expect(footer.getByRole("link", { name: cv.basics.email, exact: true })).toHaveAttribute(
      "href",
      `mailto:${cv.basics.email}`,
    );
  }
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
  // The chart is a client:visible island: it hydrates only once scrolled into
  // view, and a click before that lands on inert server-rendered markup. Astro
  // drops the `ssr` attribute when hydration finishes, so wait for that once
  // rather than retrying each interaction.
  test.beforeEach(async ({ page }) => {
    await page.locator("astro-island").scrollIntoViewIfNeeded();
    await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
  });

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
    await parts.click();
    await expect(caption).toHaveText(/Parts/i);
  });

  test("chart measure toggle updates pressed state and the accessible summary", async ({ page }) => {
    const chart = page.locator('svg[role="img"]');
    await expect(chart).toHaveAttribute("aria-label", /teardowns/i);

    const parts = page.getByRole("button", { name: "Parts" });
    await parts.click();
    await expect(parts).toHaveAttribute("aria-pressed", "true");

    await expect(chart).toHaveAttribute("aria-label", /parts/i);
    await expect(page.getByRole("button", { name: "Teardowns" })).toHaveAttribute("aria-pressed", "false");

    // Without the live region the switch is silent to a screen reader: the label
    // and the table both change off-screen with nothing announcing it.
    await expect(page.locator("[aria-live=polite]")).toHaveText(/^Parts: /);
  });

  test("arrow keys walk the tooltip, which never blocks the pointer", async ({ page }) => {
    // Hover is the only way to read an exact value, and the hidden table serves
    // screen readers only; a sighted keyboard user needs this path.
    const chart = page.locator('svg[role="img"]');
    await chart.focus();
    const tip = page.locator(".chart__tip-title");
    const first = await tip.textContent();
    expect(first).toBeTruthy();

    await page.keyboard.press("ArrowRight");
    await expect(tip).not.toHaveText(first ?? "");
    await page.keyboard.press("Home");
    await expect(tip).toHaveText(first ?? "");

    // The tooltip paints over the hit rects; without pointer-events:none it
    // swallows the hover meant for a neighbouring column and sticks.
    const labels = await page.locator("table tbody tr th").allTextContents();
    const hits = page.locator("rect.chart__hit");
    const last = (await hits.count()) - 1;
    await hits.nth(last).hover();
    await expect(tip).toHaveText(labels[last]);
  });

  test("secondary chart measures use progressive disclosure", async ({ page }) => {
    // The disclosure button relabels itself as it toggles, so hold it by element
    // and assert the accessible name separately; a by-name locator stops
    // resolving the moment the name it was built from changes.
    const more = page.locator("button.chart__more");
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await expect(more).toHaveAccessibleName("Show more measures");
    await expect(page.getByRole("button", { name: "Images" })).toBeHidden();

    await more.click();
    await expect(more).toHaveAttribute("aria-expanded", "true");
    await expect(more).toHaveAccessibleName("Show fewer measures");
    const images = page.getByRole("button", { name: "Images" });
    await expect(images).toBeVisible();
    await images.click();
    await expect(images).toHaveAttribute("aria-pressed", "true");

    await more.click();
    await expect(page.getByRole("button", { name: /Images selected\. Show more measures/ })).toBeVisible();
  });
}
