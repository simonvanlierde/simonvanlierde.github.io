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

// Assert on violations only. axe reports SVG `<text>` contrast (chart axis labels)
// as `incomplete` because it cannot resolve SVG backgrounds; that is not a failure.
async function expectNoViolations(page: Page) {
  await settle(page);
  const { violations } = await new AxeBuilder({ page }).analyze();
  const summary = violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`).join("\n");
  expect(violations, `axe violations:\n${summary}`).toEqual([]);
}

// Each colour scheme has its own tokens, and linting cannot catch contrast.
for (const colorScheme of ["light", "dark"] as const) {
  for (const path of ["/", "/cv/", "/no-such-page/"]) {
    test(`no axe violations on load (${path}, ${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(path);
      await expectNoViolations(page);
    });
  }
}

// Scan states a first-paint scan never reaches: a toggled disclosure, another
// chart measure, and the blueprint theme.
test("no axe violations after interaction", async ({ page }) => {
  await page.goto("/");

  // Personal projects ships open; fold and reopen it so the scan sees the toggled state.
  const personal = page.locator("details.disclosure.personal summary");
  await personal.click();
  await personal.click();

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
  // A fresh context starts light, so anything but "true" means the toggle is broken.
  await expect(page.locator(".theme-toggle")).toHaveAttribute("aria-pressed", "true");

  await expectNoViolations(page);
});
