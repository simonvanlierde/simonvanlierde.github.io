import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/cv/",
  "/archive/",
  "/notes/",
  "/notes/hub-and-spoke-observability/",
  "/privacy/",
  "/contact/",
  "/projects/r9lab/",
  "/projects/jsonvet/",
  "/no-such-page/",
];

for (const colorScheme of ["light", "dark"] as const) {
  test(`the theme follows the system without storing a preference (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/projects/jsonvet/");
    const toggle = page.getByRole("button", { name: "Dark mode" });
    await expect(toggle).toHaveAttribute("aria-pressed", String(colorScheme === "dark"));
    const thumbnail = page.locator(".story-preview img").first();
    await expect(thumbnail).toHaveCSS("filter", colorScheme === "dark" ? "brightness(0.88)" : "none");
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBeNull();
    const initialBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await page.emulateMedia({ colorScheme: colorScheme === "light" ? "dark" : "light" });
    await expect(toggle).toHaveAttribute("aria-pressed", String(colorScheme !== "dark"));
    await expect(thumbnail).toHaveCSS("filter", colorScheme === "light" ? "brightness(0.88)" : "none");
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
      .not.toBe(initialBackground);
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBeNull();
  });

  test(`an explicit ${colorScheme} theme survives reload, navigation and a system change`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: colorScheme === "light" ? "dark" : "light" });
    await page.goto("/projects/jsonvet/");
    const toggle = page.getByRole("button", { name: "Dark mode" });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", String(colorScheme === "dark"));
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(colorScheme);
    await expect(page.locator(".story-preview img").first()).toHaveCSS(
      "filter",
      colorScheme === "dark" ? "brightness(0.88)" : "none",
    );
    await page.reload();
    await expect(toggle).toHaveAttribute("aria-pressed", String(colorScheme === "dark"));
    await page.goto("/cv/");
    await page.emulateMedia({ colorScheme });
    await page.emulateMedia({ colorScheme: colorScheme === "light" ? "dark" : "light" });
    await expect(toggle).toHaveAttribute("aria-pressed", String(colorScheme === "dark"));
    await expect(page.locator("html")).toHaveAttribute("data-theme", colorScheme);
  });
}

for (const width of [320, 390, 1200]) {
  test(`all routes share the foundation shell without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    for (const route of routes) {
      await page.goto(route);
      const header = page.getByRole("banner");
      await expect(header).toHaveCount(1);
      await expect(header.getByRole("link", { name: "Simon van Lierde", exact: true })).toHaveAttribute("href", "/");
      const primary = page.getByRole("navigation", { name: "Primary" });
      for (const [name, href] of [
        ["Work", "/"],
        ["CV", "/cv/"],
        ["Notes", "/notes/"],
        ["Contact", "/contact/"],
      ]) {
        const link = primary.getByRole("link", { name, exact: true });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute("href", href);
        const box = await link.boundingBox();
        expect(box?.height, `${route}: ${name} touch target`).toBeGreaterThanOrEqual(44);
      }
      const footer = page.getByRole("contentinfo");
      for (const [name, href] of [
        ["Privacy", "/privacy/"],
        ["RSS feed", "/notes/rss.xml"],
        ["Source", "https://github.com/simonvanlierde/simonvanlierde.github.io"],
      ]) {
        await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
      }
      await expect(footer.getByRole("button", { name: "Dark mode" })).toHaveCount(1);
      const revision = footer.getByRole("link", { name: /^Site revision / });
      await expect(revision).toHaveAttribute(
        "href",
        /^https:\/\/github\.com\/simonvanlierde\/simonvanlierde\.github\.io\/commit\/[0-9a-f]{40}$/,
      );
      await expect(revision).toHaveText(/^[0-9a-f]{7}$/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
    }
  });
}

test("the built pages make no third-party requests", async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? "http://127.0.0.1:4321").origin;
  const external: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (["http:", "https:"].includes(url.protocol) && url.origin !== origin) external.push(url.href);
  });
  for (const route of routes) {
    await page.goto(route);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("astro-island[ssr]").filter({ visible: true })).toHaveCount(0);
  }
  expect(external).toEqual([]);
});

test("keyboard users can skip content, navigate the shell and change theme", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.goto("/projects/jsonvet/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  expect(await page.evaluate(() => document.querySelector("#main")?.contains(document.activeElement))).toBe(true);

  await page.goto("/cv/");
  for (let i = 0; i < 4; i += 1) await page.keyboard.press("Tab");
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "CV", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/cv\/$/);

  const toggle = page.getByRole("button", { name: "Dark mode" });
  for (let i = 0; i < 200; i += 1) {
    await page.keyboard.press("Tab");
    if (await toggle.evaluate((element) => element === document.activeElement)) break;
  }
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");
});

test("the homepage leads with the map while the CV retains the portrait", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Connected work");
  await expect(page.locator(".map-home")).toBeVisible();
  await expect(page.locator(".map-home").getByRole("img", { name: "Portrait of Simon van Lierde" })).toHaveCount(0);
  await page.goto("/cv/");
  await expect(page.getByRole("img", { name: "Portrait of Simon van Lierde" })).toBeVisible();
});
