import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

/**
 * Wait for animations to finish. axe samples colours once, so a scan
 * mid-transition reads half-blended values and reports false contrast failures.
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

// The claim in docs/accessibility.md: WCAG 2.2 A and AA, plus axe's best practices.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

// Assert on violations only. axe reports SVG `<text>` contrast (chart axis labels)
// as `incomplete` because it cannot resolve SVG backgrounds; that is not a failure.
async function axeViolations(page: Page) {
  await settle(page);
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`);
}

// Each colour scheme has its own tokens, and linting cannot catch contrast.
for (const colorScheme of ["light", "dark"] as const) {
  for (const path of [
    "/",
    "/cv/",
    "/archive/",
    "/notes/",
    "/phd/",
    "/notes/hub-and-spoke-observability/",
    "/no-such-page/",
  ]) {
    test(`no axe violations on load (${path}, ${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      // The sheet defaults to dark; light comes from the toggle's stored choice.
      await page.addInitScript((t) => localStorage.setItem("theme", t), colorScheme);
      await page.goto(path);
      expect(await axeViolations(page)).toEqual([]);
    });
  }
}

// Narrow screens get their own layout, such as the compact Fig. 1 plate.
for (const path of ["/", "/cv/", "/archive/", "/phd/", "/notes/hub-and-spoke-observability/"]) {
  test(`no axe violations on a phone (${path})`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    expect(await axeViolations(page)).toEqual([]);
  });
}

// The "Components" chart measure is an optional control; its absence is not a failure here.
async function pressComponents(page: Page) {
  const parts = page.getByRole("button", { name: "Components" });
  if ((await parts.count()) === 0) return;
  await expect(async () => {
    await parts.click();
    await expect(parts).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
  }).toPass();

  // Let the segment's 120ms background fade finish (see settle()).
  await parts.evaluate(
    (el) =>
      new Promise((resolve) => {
        el.addEventListener("transitionend", resolve, { once: true });
        setTimeout(resolve, 400);
      }),
  );
}

// Scan states a first-paint scan never reaches: another
// chart measure, and the light theme reached through the toggle.
test("no axe violations after interaction", async ({ page }) => {
  await page.goto("/");
  await pressComponents(page);

  await page.locator(".theme-toggle").click();
  // A fresh context starts dark, so anything but "false" means the toggle is broken.
  await expect(page.locator(".theme-toggle")).toHaveAttribute("aria-pressed", "false");

  expect(await axeViolations(page)).toEqual([]);
});
