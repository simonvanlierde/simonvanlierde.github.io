import { expect, test } from "@playwright/test";

for (const reduced of [false, true]) {
  test(`map navigation preserves continuous camera motion; reduced=${reduced}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForFunction(() => !document.querySelector("astro-island[ssr]"));
    const map = page.locator(".map-drawing.wide");
    await page.getByRole("button", { name: "Start with R9lab" }).waitFor();
    const samples = await map.evaluate(async (svg) => {
      const frames = [svg.getAttribute("viewBox")];
      (document.querySelector(".start-project") as HTMLButtonElement).click();
      for (let frame = 0; frame < 40; frame++) {
        await new Promise(requestAnimationFrame);
        frames.push(svg.getAttribute("viewBox"));
      }
      return frames;
    });
    expect(new Set(samples).size).toBeGreaterThan(reduced ? 0 : 4);
    expect(new Set(samples.slice(2)).size).toBeLessThanOrEqual(reduced ? 1 : 40);
    const focused = await map.getAttribute("viewBox");
    expect(focused).not.toBe(samples[0]);
    await page
      .getByRole("complementary", { name: "R9lab", exact: true })
      .getByRole("button", { name: /cv-ie-taxonomy/ })
      .click();
    await expect.poll(() => map.getAttribute("viewBox")).not.toBe(focused);
    await page.goBack();
    await expect(page.getByRole("complementary", { name: "R9lab", exact: true })).toBeVisible();
    // Interrupt navigation twice before either camera journey has settled.
    await page.evaluate(() => {
      (document.querySelector(".related-projects button") as HTMLButtonElement).click();
      (document.querySelector(".reading-navigation button") as HTMLButtonElement).click();
    });
    await expect(map).toHaveAttribute("viewBox", samples[0] ?? "");
    await expect(page.locator(".map-detail")).toBeHidden();
    await expect(map.locator('[data-node-id="group-duinlab"]')).toBeVisible();
  });
}
