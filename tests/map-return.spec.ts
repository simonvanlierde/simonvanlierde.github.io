import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`${width}px map return skips visited projects and folds the overview`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?project=r9lab&cluster=group-duinlab");
    const drawing = page.locator(`.map-drawing.${width < 1080 ? "phone" : "wide"}`);
    await drawing.locator('[data-node-id="jsonvet"]').click();
    await expect(page.locator("#map-detail-title")).toHaveText("jsonvet");
    await drawing.locator('[data-node-id="r9lab"]').click();
    await expect(page.locator("#map-detail-title")).toHaveText("R9lab");
    await page.getByRole("button", { name: "Back to map", exact: true }).click();
    await expect(page.locator(".map-detail")).toBeHidden();
    expect(new URL(page.url()).searchParams.has("project")).toBe(false);
    expect(new URL(page.url()).searchParams.has("cluster")).toBe(false);
    await expect(drawing.locator('[data-node-id="r9lab"]')).toBeFocused();
    await page.goBack();
    await expect(page.locator("#map-detail-title")).toHaveText("R9lab");
  });

  test(`${width}px direct arrival returns focus to the folded parent`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?project=tide&cluster=group-duinlab&thread=all");
    await page.getByRole("button", { name: "Back to map", exact: true }).click();
    await expect(page.locator(".map-detail")).toBeHidden();
    await expect(
      page.locator(`.map-drawing.${width < 1080 ? "phone" : "wide"} [data-node-id="group-duinlab"]`),
    ).toBeFocused();
    expect(new URL(page.url()).searchParams.get("thread")).toBe("all");
  });
}
