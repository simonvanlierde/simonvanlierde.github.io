import { expect, test } from "@playwright/test";

test("tablet project names stay clear of relationship labels", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto("/?project=r9lab");
  await expect(page.getByRole("complementary", { name: "R9lab", exact: true })).toBeVisible();
  await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== "running"));
  const overlaps = await page.locator(".map-drawing.phone .node-content:has(.node-relation)").evaluateAll((nodes) =>
    nodes
      .filter((node) => {
        const label = node.querySelector(".node-label")?.getBoundingClientRect();
        const relation = node.querySelector(".node-relation")?.getBoundingClientRect();
        return !label || !relation || label.bottom > relation.top + 1;
      })
      .map((node) => node.querySelector<HTMLButtonElement>("button")?.dataset.nodeId),
  );
  expect(overlaps).toEqual([]);
});

test("supporting tools remain readable, explain their relationship and respond to exploration", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?project=r9lab");
  const map = page.locator(".map-drawing.wide");
  const tool = map.getByRole("button", { name: "jsonvet: show project details", exact: true });
  await expect(tool).toHaveAccessibleDescription("Tooling for R9lab");
  const edge = map.locator('.flow.tooling[data-from="jsonvet"][data-to="r9lab"]');
  await expect(edge).toHaveClass(/secondary/);
  await tool.hover();
  await expect(edge).toHaveClass(/traced/);
  await tool.click();
  await expect(page.getByRole("complementary", { name: "jsonvet", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("complementary", { name: "R9lab", exact: true })).toBeVisible();
  await expect(tool).toHaveAccessibleDescription("Tooling for R9lab");
  await expect(map.locator('[data-node-id="group-duinlab"]')).toHaveCount(0);
});

test("selected map shows direct connections and keeps its landmarks stable while zooming", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const map = page.locator(".map-drawing.wide");
  const taxonomy = map.locator('[data-node-id="cv-ie-taxonomy"]');
  const position = await taxonomy.evaluate((node) => [
    node.closest("foreignObject")?.getAttribute("x"),
    node.closest("foreignObject")?.getAttribute("y"),
  ]);
  await map.getByRole("button", { name: "R9lab: show project details", exact: true }).click();
  await expect(map.locator('[data-node-id="group-duinlab"]')).toHaveCount(0);
  await expect(map.locator('.secondary-context [data-node-id="jsonvet"]')).toBeVisible();
  await expect(map.locator('.secondary-context [data-node-id="monitoring"]')).toBeVisible();
  await expect(taxonomy).toBeVisible();
  await expect
    .poll(async () => {
      const pane = await page.locator(".map-detail").boundingBox();
      const figure = await page.locator(".map-figure").boundingBox();
      return (pane?.width ?? 0) - (figure?.width ?? 0);
    })
    .toBeGreaterThan(0);
  const current = await taxonomy.evaluate((node) => [
    node.closest("foreignObject")?.getAttribute("x"),
    node.closest("foreignObject")?.getAttribute("y"),
  ]);
  expect(current).toEqual(position);
  await expect(map.locator(".flow.loop, .flow-packet.loop, .loop-label")).toHaveCount(0);
  const reading = page.getByRole("complementary", { name: "R9lab", exact: true });
  const next = reading.getByRole("button", { name: /cv-ie-taxonomy/ });
  expect((await next.boundingBox())?.y).toBeLessThan((await reading.locator(".r9lab__chart").boundingBox())?.y ?? 0);
  await taxonomy.click();
  await expect(page.getByRole("complementary", { name: "cv-ie-taxonomy", exact: true })).toBeVisible();
  await expect(map.getByRole("button", { name: "R9lab: show project details", exact: true })).toBeVisible();
  await page.goBack();
  await expect(reading).toBeVisible();
  await page.getByRole("button", { name: "Back to map", exact: true }).click();
  await expect(map.locator('[data-node-id="group-duinlab"]')).toBeVisible();
});

test("input context opens locally and its evidence is an explicit link", async ({ page }) => {
  await page.goto("/");
  const map = page.locator(".map-drawing.wide");
  await map.getByRole("button", { name: "Products: show context", exact: true }).click();
  await expect(page).toHaveURL(/context=products/);
  const context = page.getByRole("complementary", { name: "Products", exact: true });
  await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== "running"));
  const crossedCaptions = await map.evaluate((svg) => {
    const captions = Array.from(svg.querySelectorAll<SVGTextElement>(".world-label, .band-label, .empty-lane-note"));
    return Array.from(svg.querySelectorAll<SVGPathElement>(".flow")).flatMap((path) => {
      const length = path.getTotalLength();
      return captions
        .filter((caption) => {
          const box = caption.getBBox();
          return Array.from({ length: Math.ceil(length / 2) + 1 }, (_, index) => path.getPointAtLength(index * 2)).some(
            (point) =>
              point.x > box.x && point.x < box.x + box.width && point.y > box.y && point.y < box.y + box.height,
          );
        })
        .map((caption) => caption.textContent);
    });
  });
  expect(crossedCaptions).toEqual([]);
  await expect(context.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
    "href",
    "https://api.r9lab.io/v1/stats/totals",
  );
  await context.getByRole("button", { name: /R9lab/ }).click();
  await expect(page.getByRole("complementary", { name: "R9lab", exact: true })).toBeVisible();
  await page.goBack();
  await expect(context).toBeVisible();
  await page.reload();
  await expect(context).toBeVisible();
});

test("tablet closing and history restore focus in the visible drawing", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto("/");
  const node = page.locator('.map-drawing.phone [data-node-id="r9lab"]');
  await node.click();
  await page.keyboard.press("Escape");
  await expect(node).toBeFocused();
  await page.goBack();
  await expect(page.getByRole("complementary", { name: "R9lab", exact: true })).toBeVisible();
  await page.goBack();
  await expect(node).toBeFocused();
});

test("the map contains the full story and connected navigation restores its context", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "R9lab: show project details", exact: true }).click();
  const reading = page.getByRole("complementary", { name: "R9lab", exact: true });
  const paneBox = await reading.boundingBox();
  const mapBox = await page.locator(".map-figure").boundingBox();
  expect((paneBox?.x ?? 0) + (paneBox?.width ?? 0)).toBeLessThanOrEqual(mapBox?.x ?? 0);
  expect(
    await reading.evaluate((pane) => {
      const figure = document.querySelector(".map-figure");
      return !!figure && pane.compareDocumentPosition(figure) === Node.DOCUMENT_POSITION_FOLLOWING;
    }),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(reading.getByRole("link", { name: "Open R9lab", exact: true })).toBeFocused();
  await expect(reading.locator(".r9lab__chart")).toBeVisible();
  await reading.getByRole("button", { name: "Components", exact: true }).click();
  await expect(reading.locator('svg[role="img"]')).toHaveAttribute("aria-label", /components/i);
  await expect(page.locator("#work-heading, .bom-row, #relab")).toHaveCount(0);
  await reading.getByRole("button", { name: /cv-ie-taxonomy/ }).click();
  await expect(page).toHaveURL(/project=cv-ie-taxonomy/);
  await page.goBack();
  await expect(reading).toBeVisible();
  await expect(reading.getByRole("button", { name: "Components", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Back to map", exact: true }).click();
  await expect(reading).toBeHidden();
});

test("clusters unfold in place and only one remains open", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const map = page.locator(".map-drawing.wide");
  await map.getByRole("button", { name: /duinlab.*unfold/ }).click();
  await expect(map.getByRole("button", { name: "bikespot: show project details", exact: true })).toBeVisible();
  await expect(map.getByRole("button", { name: /duinlab.*fold cluster/ })).toHaveAttribute("aria-expanded", "true");
  await map.getByRole("button", { name: /Research software.*unfold/ }).click();
  await expect(map.getByRole("button", { name: "bikespot: show project details", exact: true })).toHaveCount(0);
  await expect(map.getByRole("button", { name: /duinlab.*unfold/ })).toHaveAttribute("aria-expanded", "false");
});
