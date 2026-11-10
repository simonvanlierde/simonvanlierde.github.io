import { expect, test } from "@playwright/test";

const POST = "/notes/hub-and-spoke-observability/";

test("the feed is valid RSS with the post as an item", async ({ request }) => {
  const res = await request.get("/notes/rss.xml");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toMatch(/xml/);
  const xml = await res.text();
  expect(xml).toContain('<rss version="2.0"');
  expect(xml).toContain('<atom:link href="https://simonvanlierde.com/notes/rss.xml" rel="self"');
  expect(xml).toContain(`<link>https://simonvanlierde.com${POST}</link>`);
  expect(xml).toMatch(/<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} 00:00:00 GMT<\/pubDate>/);
});

test("the post page, the notes index and the landing page link to each other", async ({ page }) => {
  await page.goto(POST);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Hub-and-spoke observability/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://simonvanlierde.com${POST}`);
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute(
    "href",
    "/notes/rss.xml",
  );
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Sheet 4: Notes" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("region", { name: "Document title block" }).getByText("4 OF 4", { exact: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: "All notes" }).click();
  await expect(page).toHaveURL(/\/notes\/$/);
  await expect(page.getByRole("link", { name: /Hub-and-spoke observability/ })).toHaveAttribute("href", POST);

  await page.goto("/");
  await expect(page.getByRole("link", { name: /Hub-and-spoke observability/ })).toHaveAttribute("href", POST);
});

test("the sitemap lists the notes index and each note", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("<loc>https://simonvanlierde.com/notes/</loc>");
  expect(xml).toContain(`<loc>https://simonvanlierde.com${POST}</loc>`);
});

// With `defaultColor: false`, Shiki writes each token's colours as --shiki-light and --shiki-dark
// only, and the site's CSS picks one, so the theme toggle switches code too.
test("fenced code follows the colour scheme", async ({ page }) => {
  const token = async (scheme: "light" | "dark") => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.addInitScript((t) => localStorage.setItem("theme", t), scheme);
    await page.goto(POST);
    return page
      .locator("pre.astro-code span[style*='--shiki-light']")
      .first()
      .evaluate((el, s) => {
        // The variable as the browser resolves it, next to the colour the token gets.
        const probe = document.createElement("span");
        probe.style.color = getComputedStyle(el).getPropertyValue(`--shiki-${s}`);
        document.body.append(probe);
        return [getComputedStyle(el).color, getComputedStyle(probe).color];
      }, scheme);
  };
  const [light, lightVar] = await token("light");
  const [dark, darkVar] = await token("dark");
  expect(light).toBe(lightVar);
  expect(dark).toBe(darkVar);
  expect(light).not.toBe(dark);
});
