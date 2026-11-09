import { expect, test } from "@playwright/test";

test("the privacy page names the processors and has its own metadata", async ({ page }) => {
  await page.goto("/privacy/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy");
  await expect(page).toHaveTitle("Privacy | Simon van Lierde");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://simonvanlierde.com/privacy/");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
  const main = page.getByRole("main");
  for (const word of ["GitHub", "Cloudflare", "legitimate interest", "Autoriteit Persoonsgegevens"]) {
    await expect(main).toContainText(word);
  }
});

test("every sheet's footer links to the privacy page", async ({ page }) => {
  for (const path of ["/", "/cv/", "/archive/", "/notes/", "/privacy/"]) {
    await page.goto(path);
    await expect(
      page.getByRole("region", { name: "Document title block" }).getByRole("link", { name: "Privacy" }),
    ).toHaveAttribute("href", "/privacy/");
  }
});

test("the sitemap lists the privacy page", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("<loc>https://simonvanlierde.com/privacy/</loc>");
});
