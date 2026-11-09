import { expect, test } from "@playwright/test";

test("the PhD sheet renders its outputs and project cards, and marks itself current", async ({ page }) => {
  await page.goto("/phd/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Thesis outputs" })).toBeVisible();
  await expect(page.locator(".cv-entry").first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Software and data from the PhD" })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://simonvanlierde.com/phd/");

  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Sheet 5: PhD" }),
  ).toHaveAttribute("aria-current", "page");
  const block = page.getByRole("region", { name: "Document title block" });
  await expect(block.getByText("5 OF 5", { exact: true })).toBeVisible();
  await expect(block.getByRole("link", { name: "5 OF 5, go to sheet 4, notes" })).toHaveAttribute("href", "/notes/");
});

test("the sitemap lists the PhD sheet", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("<loc>https://simonvanlierde.com/phd/</loc>");
});
