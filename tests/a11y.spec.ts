import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

/**
 * Wait until nothing on the page is still animating. A contrast scan samples
 * computed colours once, so scanning mid-transition reads half-blended values:
 * that is what produced a 3.66:1 reading on the segmented control (settled: 5.5:1)
 * and, twice, an intermittent failure on a freshly loaded page. axe is meant to
 * audit a settled page, so settling first is part of asking the question properly.
 */
async function settle(page: Page) {
  await page.waitForLoadState("load");
  await page
    .waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running"), null, {
      timeout: 2000,
    })
    .catch(() => {
      /* A permanent animation would be a finding of its own; don't hide it here. */
    });
}

// Assert on axe `violations` only. axe returns SVG `<text>` contrast (the chart
// axis labels) as `incomplete` because it cannot resolve an SVG element's
// background. That is inconclusive, not a failure, so ignoring it here is
// correct and needs no element hiding.
async function expectNoViolations(page: Page) {
  await settle(page);
  const { violations } = await new AxeBuilder({ page }).analyze();
  const summary = violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`).join("\n");
  expect(violations, `axe violations:\n${summary}`).toEqual([]);
}

// Both colour schemes are scanned because the site ships distinct light/dark
// tokens, and contrast is the class of issue static linting can't catch.
for (const colorScheme of ["light", "dark"] as const) {
  for (const path of ["/", "/cv/", "/no-such-page/"]) {
    test(`no axe violations on load (${path}, ${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(path);
      await expectNoViolations(page);
    });
  }
}

// Scan a mutated DOM, not just first paint: open the personal-projects
// disclosure, switch the chart measure when a chart is rendered at all, and
// scroll so the sticky nav condenses (its icon links only enter the a11y tree
// once shown), then re-check. Regressions often hide in the states a static scan
// of the initial page never reaches.
test("no axe violations after interaction", async ({ page }) => {
  await page.goto("/");

  await page.locator("details.disclosure.personal summary").click();

  const parts = page.getByRole("button", { name: "Parts" });
  if ((await parts.count()) > 0) {
    await expect(async () => {
      await parts.click();
      await expect(parts).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
    }).toPass();

    // Let the segment's 120ms background fade finish. Scanned mid-transition,
    // axe samples a half-blended fill and reports 3.66:1 for a pair that reads
    // at 5.5:1 once settled: a measurement artefact, not a contrast failure.
    await parts.evaluate(
      (el) =>
        new Promise((resolve) => {
          el.addEventListener("transitionend", resolve, { once: true });
          setTimeout(resolve, 400);
        }),
    );
  }

  await page.mouse.wheel(0, 2000);
  await expect(page.locator(".site-nav")).toHaveClass(/is-condensed/);

  await expectNoViolations(page);
});
