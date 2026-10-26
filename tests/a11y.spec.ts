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
async function expectNoViolations(page: Page) {
  await settle(page);
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`).join("\n");
  expect(violations, `axe violations:\n${summary}`).toEqual([]);
}

// Each colour scheme has its own tokens, and linting cannot catch contrast.
for (const colorScheme of ["light", "dark"] as const) {
  for (const path of ["/", "/cv/", "/no-such-page/"]) {
    test(`no axe violations on load (${path}, ${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      // The sheet defaults to dark; light comes from the toggle's stored choice.
      await page.addInitScript((t) => localStorage.setItem("theme", t), colorScheme);
      await page.goto(path);
      await expectNoViolations(page);
    });
  }
}

// Narrow screens get their own layout, such as the compact Fig. 1 plate.
test("no axe violations on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expectNoViolations(page);
});

// Scan states a first-paint scan never reaches: a toggled disclosure, another
// chart measure, and the light theme reached through the toggle.
test("no axe violations after interaction", async ({ page }) => {
  await page.goto("/");

  // Both lists ship open; fold one so the scan sees a closed list and its count.
  await page.locator("details.disclosure.personal summary").click();

  const parts = page.getByRole("button", { name: "Components" });
  if ((await parts.count()) > 0) {
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

  await page.locator(".theme-toggle").click();
  // A fresh context starts dark, so anything but "false" means the toggle is broken.
  await expect(page.locator(".theme-toggle")).toHaveAttribute("aria-pressed", "false");

  await expectNoViolations(page);
});
