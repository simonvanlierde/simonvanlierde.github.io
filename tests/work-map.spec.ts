import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("desktop map reveals project details beside it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const map = page.getByRole("group", { name: /metabolism of my work/ });
  const node = map.getByRole("button", { name: "R9lab: show project details", exact: true });
  await node.click();
  const detail = page.getByRole("complementary", { name: "R9lab", exact: true });
  await expect(detail.getByRole("link", { name: "Open R9lab as a page", exact: true })).toHaveAttribute(
    "href",
    "/projects/r9lab/",
  );
  await page.keyboard.press("Escape");
  await expect(detail).toBeHidden();
  await expect(node).toBeFocused();
  await page.getByLabel("Follow a thread").selectOption("footprints-and-flows");
  await expect(
    map.getByRole("button", { name: "brightway-benchmarks: show project details", exact: true }),
  ).toBeVisible();
});

test("mobile project summary expands for reading and restores map focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const map = page.getByRole("group", { name: /metabolism of my work/ });
  const node = map.getByRole("button", { name: "R9lab: show project details", exact: true });
  await node.click();
  const detail = page.getByRole("complementary", { name: "R9lab", exact: true });
  await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== "running"));
  await expect
    .poll(async () => {
      const nodeBox = await node.boundingBox();
      const sheetBox = await detail.boundingBox();
      return (sheetBox?.y ?? 0) - ((nodeBox?.y ?? 0) + (nodeBox?.height ?? 0));
    })
    .toBeGreaterThanOrEqual(8);
  await detail.getByRole("button", { name: "Read more", exact: true }).focus();
  await page.keyboard.press("Enter");
  const reading = page.getByRole("dialog", { name: "R9lab", exact: true });
  await expect(reading).toBeVisible();
  await expect(reading.getByRole("heading", { name: "R9lab", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(reading.getByRole("link", { name: "Open R9lab", exact: true })).toBeFocused();
  const firstControl = reading.getByRole("button", { name: "Back to map", exact: true });
  await firstControl.focus();
  await page.keyboard.press("Shift+Tab");
  expect(await reading.evaluate((pane) => pane.contains(document.activeElement))).toBe(true);
  await reading.getByRole("button", { name: "Show the map", exact: true }).click();
  await expect(detail.getByRole("button", { name: "Read more", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(reading.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/CMLPlatform/r9lab",
  );
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"])
    .analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(reading).toHaveCount(0);
  await expect(node).toBeFocused();
});

test("a selected project stays above its sheet when resizing to mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator('.map-drawing.wide [data-node-id="r9lab"]').click();
  // Resize a settled project view, after its camera movement has finished.
  await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== "running"));
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(async () => {
      const node = await page.locator('.map-drawing.phone [data-node-id="r9lab"]').boundingBox();
      const sheet = await page.getByRole("complementary", { name: "R9lab", exact: true }).boundingBox();
      return (sheet?.y ?? 0) - ((node?.y ?? 0) + (node?.height ?? 0));
    })
    .toBeGreaterThanOrEqual(8);
  await page.getByRole("button", { name: "Read more", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "R9lab", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole("complementary", { name: "R9lab", exact: true })).toBeVisible();
  expect(await page.locator(".site-header").evaluate((element) => (element as HTMLElement).inert)).toBe(false);
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("the whole project list is readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/");
  const list = page.locator("#work-map-list");
  await list.locator("summary").click();
  await expect(list.getByRole("link", { name: "R9lab", exact: true })).toHaveAttribute("href", "/projects/r9lab/");
  await expect(list.getByRole("link", { name: "sourceledger", exact: true })).toBeVisible();
  await context.close();
});

for (const width of [390, 1440]) {
  test(`the ${width}px overview shows context and selection isolates direct connections`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const map = page.locator(width < 720 ? ".map-drawing.phone" : ".map-drawing.wide");
    expect(await map.locator(".project-connection.muted").count()).toBeGreaterThan(0);
    await expect(map.locator(".project-connection:not(.muted)")).toHaveCount(0);
    await expect(map.locator(".metabolism-overview")).toBeVisible();
    const captionCrossings = await map.evaluate((svg) => {
      const label = Array.from(svg.querySelectorAll("text")).find((text) => text.textContent?.startsWith("Downstream"));
      if (!label) throw new Error("Downstream caption is missing");
      const box = label.getBBox();
      return Array.from(svg.querySelectorAll<SVGPathElement>(".flow"))
        .filter((path) => {
          const length = path.getTotalLength();
          return Array.from({ length: 201 }, (_, i) => path.getPointAtLength((length * i) / 200)).some(
            (point) =>
              point.x > box.x && point.x < box.x + box.width && point.y > box.y && point.y < box.y + box.height,
          );
        })
        .map((path) => `${path.dataset.from}:${path.dataset.to}`);
    });
    expect(captionCrossings).toEqual([]);

    await map.getByRole("button", { name: "R9lab: show project details", exact: true }).click();
    await expect(map.locator('.project-connection[data-from="products"][data-to="r9lab"]')).toBeVisible();
    const dependency = map.locator('.project-connection[data-from="cv-ie-taxonomy"][data-to="r9lab"]');
    await expect(dependency).toHaveCount(1);
    await expect(dependency).toHaveCSS("visibility", "visible");
    expect(await dependency.evaluate((path: SVGPathElement) => path.getTotalLength())).toBeGreaterThan(0);
    await expect(map.locator('.project-connection[data-to="msc-thesis-ie"]')).toHaveCount(0);
    await expect(map.locator('.project-connection[data-from="products"][data-to="r9lab"]')).not.toHaveClass(/muted/);
    await page.keyboard.press("Escape");
    expect(await map.locator(".project-connection.muted").count()).toBeGreaterThan(0);
    await expect(map.locator(".project-connection:not(.muted)")).toHaveCount(0);
    await expect(map.locator(".metabolism-overview")).toBeVisible();
  });
}

for (const reduced of [false, true]) {
  test(`project flow feedback respects reduced motion: ${reduced}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
    await page.goto("/");
    const map = page.locator(".map-drawing.wide");
    await map.getByRole("button", { name: "R9lab: show project details", exact: true }).click();
    await expect(page.getByRole("complementary", { name: "R9lab", exact: true })).toBeVisible();
    expect((await map.locator(".flow-packet").count()) > 0).toBe(!reduced);
    await page.getByLabel("Follow a thread").selectOption("footprints-and-flows");
    await expect(
      map.getByRole("button", { name: "brightway-benchmarks: show project details", exact: true }),
    ).toBeVisible();
    await expect(map.locator(".flow-packet")).toHaveCount(0);
  });
}
