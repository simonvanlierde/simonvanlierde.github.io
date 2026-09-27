import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";

// Read the export instead of restating it (see tests/cv.spec.ts).
const cv = parse(readFileSync("src/data/cv-public.yaml", "utf8"));
const stats = JSON.parse(readFileSync("src/data/stats.json", "utf8"));

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("renders the page shell: title, main landmark, single h1", async ({ page }) => {
  await expect(page).toHaveTitle(/Simon van Lierde/);
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Simon van Lierde");
});

// The sheet frame and the exploded view reach outside their boxes at small widths.
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
  // ORCID and Leiden have no export field yet, so they are hard-coded here too.
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
  // The h1 and the primary stamp are content, so they sit inside the skip target.
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

test("the personal-projects disclosure ships open and still collapses", async ({ page }) => {
  const details = page.locator("details.disclosure.personal");
  await expect(details).toHaveJSProperty("open", true);
  await details.locator("summary").click();
  await expect(details).toHaveJSProperty("open", false);
  await details.locator("summary").click();
  await expect(details).toHaveJSProperty("open", true);
});

test("the hero has exactly one stamp, and it is the CV", async ({ page }) => {
  // The header allows one stamp, and it goes to the CV. An exported address sits
  // beside it as a plain link.
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

// Each balloon's href is hand-written in the SVG, so copy-paste slips are likely.
// This list is the independent check.
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
      // The label names the part, so a swapped balloon fails here.
      await expect(links.nth(i)).toHaveAttribute("aria-label", new RegExp(`^${name}:`));
    }
  });
}

test("a keyboard user can focus each part of the figure", async ({ page }) => {
  const first = page.locator(".exploded__svg--desktop a").first();
  await first.focus();
  await expect(first).toBeFocused();
  // Sighted keyboard users find the part by its focus ring.
  await expect(first).toHaveCSS("outline-style", "solid");
});

test("without motion the drawing starts exploded and never assembles", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // Reduced motion must skip the settle animation, not shorten it.
  await expect(page.locator(".exploded")).not.toHaveClass(/is-assembled/);
});

test("the title block states what the sheet is, and when it was drawn", async ({ page }) => {
  const block = page.getByRole("region", { name: "Document title block" });
  await expect(block.getByText("Simon van Lierde", { exact: true })).toBeVisible();
  await expect(block.getByText("Index of work", { exact: true })).toBeVisible();
  await expect(block.getByText("1 OF 2", { exact: true })).toBeVisible();

  // This sheet takes the later of the export and stats dates, in UTC.
  await expect(block.getByText("Dated", { exact: true })).toBeVisible();
  const latest = [cv.exported.slice(0, 10), stats.as_of].sort().at(-1) ?? "";
  await expect(block.locator("time")).toHaveAttribute("datetime", latest);

  const rev = block.getByRole("link", { name: /^Site version / });
  await expect(rev).toHaveAttribute("href", "https://github.com/simonvanlierde/simonvanlierde.github.io");
  await expect(rev).toHaveText(/^v\d+\.\d+\.\d+/);
});

test("a sheet with nothing generated is attributed rather than dated", async ({ page }) => {
  // The 404 has no export behind it, so it falls back to "Drawn by".
  await page.goto("/no-such-page/");
  const block = page.getByRole("region", { name: "Document title block" });
  await expect(block.getByText("Drawn by", { exact: true })).toBeVisible();
  await expect(block.getByText("SVL", { exact: true })).toBeVisible();
  await expect(block.locator("time")).toHaveCount(0);
  await expect(block.getByText("NOT IN SET", { exact: true })).toBeVisible();
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

test.describe("disassembly chart", () => {
  // The chart hydrates on scroll (client:visible). Astro drops `ssr` once it has
  // hydrated, so wait for that before interacting.
  test.beforeEach(async ({ page }) => {
    await page.locator("astro-island").scrollIntoViewIfNeeded();
    await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
  });

  test("the visually-hidden data table mirrors the plotted series", async ({ page }) => {
    // The hidden table is the accessible fallback, so it must match the plotted months.
    const rows = page.locator("table tbody tr");
    const columns = page.locator("rect.chart__hit");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    await expect(columns).toHaveCount(rowCount);

    const caption = page.locator("table caption");
    await expect(caption).toHaveText(/Products/i);

    const parts = page.getByRole("button", { name: "Components" });
    await parts.click();
    await expect(caption).toHaveText(/Components/i);
  });

  test("chart measure toggle updates pressed state and the accessible summary", async ({ page }) => {
    const chart = page.locator('svg[role="img"]');
    await expect(chart).toHaveAttribute("aria-label", /products/i);

    const parts = page.getByRole("button", { name: "Components" });
    await parts.click();
    await expect(parts).toHaveAttribute("aria-pressed", "true");

    await expect(chart).toHaveAttribute("aria-label", /components/i);
    await expect(page.getByRole("button", { name: "Products" })).toHaveAttribute("aria-pressed", "false");

    // Without the live region, a screen reader hears nothing when the measure switches.
    await expect(page.locator("[aria-live=polite]")).toHaveText(/^Components: /);
  });

  test("arrow keys walk the tooltip, which never blocks the pointer", async ({ page }) => {
    // Sighted keyboard users read exact values here; the hidden table serves screen readers.
    const chart = page.locator('svg[role="img"]');
    await chart.focus();
    const tip = page.locator(".chart__tip-title");
    const first = await tip.textContent();
    expect(first).toBeTruthy();

    await page.keyboard.press("ArrowRight");
    await expect(tip).not.toHaveText(first ?? "");
    await page.keyboard.press("Home");
    await expect(tip).toHaveText(first ?? "");

    // The tooltip covers the hit rects; without pointer-events:none it swallows hovers.
    const labels = await page.locator("table tbody tr th").allTextContents();
    const hits = page.locator("rect.chart__hit");
    const last = (await hits.count()) - 1;
    await hits.nth(last).hover();
    await expect(tip).toHaveText(labels[last]);
  });

  test("month labels never overlap on a phone, and the latest keeps its label", async ({ page }) => {
    // Overlapping labels read as one word.
    await page.setViewportSize({ width: 390, height: 844 });
    const boxes = await page.locator("text.chart__xlabel").evaluateAll((els) =>
      els
        .filter((el) => getComputedStyle(el).display !== "none")
        .map((el) => el.getBoundingClientRect())
        .map((r) => ({ left: r.left, right: r.right })),
    );
    expect(boxes.length).toBeGreaterThan(1);
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].left, `label ${i} overlaps label ${i - 1}`).toBeGreaterThanOrEqual(boxes[i - 1].right);
    }
    await expect(page.locator("text.chart__xlabel").last()).toBeVisible();
  });

  test("secondary chart measures use progressive disclosure", async ({ page }) => {
    // The button relabels itself, so locate it by element, not by name.
    const more = page.locator("button.chart__more");
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await expect(more).toHaveAccessibleName("Show more measures");
    await expect(page.getByRole("button", { name: "Mass" })).toBeHidden();

    await more.click();
    await expect(more).toHaveAttribute("aria-expanded", "true");
    await expect(more).toHaveAccessibleName("Show fewer measures");
    const images = page.getByRole("button", { name: "Mass" });
    await expect(images).toBeVisible();
    await images.click();
    await expect(images).toHaveAttribute("aria-pressed", "true");

    await more.click();
    await expect(page.getByRole("button", { name: /Mass selected\. Show more measures/ })).toBeVisible();
  });
});
