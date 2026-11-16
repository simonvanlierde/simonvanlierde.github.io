import { expect, test } from "@playwright/test";

test("monthly data stays available without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/projects/r9lab/");
  await page.getByText("Monthly data", { exact: true }).click();
  const table = page.getByRole("table", { name: "Products, running total by month" });
  await expect(table).toBeVisible();
  expect(await table.locator("tbody tr").count()).toBeGreaterThan(0);
  await context.close();
});

test("the project story and chart use the wide reading pane", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/?project=r9lab");
  const reading = page.getByRole("complementary", { name: "R9lab", exact: true });
  await expect(reading).toBeVisible();
  await expect
    .poll(async () =>
      reading.evaluate((pane) => {
        const body = pane.querySelector(".reading-body")?.getBoundingClientRect();
        const story = pane.querySelector('[data-project-story="r9lab"]')?.getBoundingClientRect();
        return (story?.width ?? 0) / (body?.width ?? 1);
      }),
    )
    .toBeGreaterThan(0.98);
  await expect
    .poll(async () =>
      reading.evaluate((pane) => {
        const story = pane.querySelector('[data-project-story="r9lab"]')?.getBoundingClientRect();
        const chart = pane.querySelector(".chart")?.getBoundingClientRect();
        return (chart?.width ?? 0) / (story?.width ?? 1);
      }),
    )
    .toBeGreaterThan(0.98);
  const data = reading.locator(".chart__data");
  await data.getByText("Monthly data", { exact: true }).click();
  await expect(data.getByRole("table")).toBeVisible();
  expect(await data.locator("tbody tr").count()).toBeGreaterThan(0);
});
