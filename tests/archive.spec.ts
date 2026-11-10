import { expect, test } from "@playwright/test";

test("the project register groups research tools, personal apps and smaller projects", async ({ page }) => {
  await page.goto("/archive/");
  const register = page.locator("section", { has: page.locator("#projects-heading") });
  await expect(register.getByRole("heading", { level: 3 })).toHaveText([
    "Research tools",
    "Personal apps",
    "Smaller projects",
  ]);
  const group = (name: string) => register.getByRole("table", { name });
  await expect(group("Research tools").locator("#project-citesync")).toHaveCount(1);
  await expect(group("Personal apps").locator("#project-6-second-scribbles")).toHaveCount(1);
  await expect(group("Smaller projects").locator("#project-ai4ie")).toHaveCount(1);
});

// The page itself never scrolled; the table scrolled inside its wrapper and hid Stack and Link.
test("the project register restacks at 390px with every column in view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/archive/");
  const overflow = await page.evaluate(() =>
    [document.documentElement, ...document.querySelectorAll("#main *")]
      // Visually hidden text clips inside a 1px box on purpose.
      .filter((el) => el.clientWidth > 1)
      .filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible")
      .map((el) => el.className || el.tagName),
  );
  expect(overflow).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const source = page.getByRole("link", { name: "Source for citesync", exact: true });
  const box = await source.boundingBox();
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390);
});
