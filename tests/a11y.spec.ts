import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// Assert on axe `violations` only. axe returns SVG `<text>` contrast (the chart
// axis labels) as `incomplete` because it cannot resolve an SVG element's
// background — that is inconclusive, not a failure, so ignoring it here is
// correct and needs no element hiding.
async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const summary = violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`).join("\n");
  expect(violations, `axe violations:\n${summary}`).toEqual([]);
}

// Both colour schemes are scanned because the site ships distinct light/dark
// tokens, and contrast is the class of issue static linting can't catch.
for (const colorScheme of ["light", "dark"] as const) {
  test(`no axe violations on load (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");
    await expectNoViolations(page);
  });
}

// Scan a mutated DOM, not just first paint: switch the chart to another measure
// and scroll so the sticky nav condenses (its icon links only enter the a11y
// tree once shown), then re-check. Regressions often hide in the states a static
// scan of the initial page never reaches.
test("no axe violations after interaction", async ({ page }) => {
  await page.goto("/");

  const parts = page.getByRole("button", { name: "Parts" });
  await expect(async () => {
    await parts.click();
    await expect(parts).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
  }).toPass();

  await page.mouse.wheel(0, 2000);
  await expect(page.locator(".site-nav")).toHaveClass(/is-condensed/);

  await expectNoViolations(page);
});
