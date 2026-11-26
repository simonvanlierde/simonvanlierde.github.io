import { expect, test } from "@playwright/test";

test("the policy precedes executable scripts and blocks an unlisted script", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("meta[http-equiv=Content-Security-Policy]")).toHaveCount(1);

  const policyComesFirst = await page.evaluate(() => {
    const ordered = document.querySelectorAll(
      'meta[http-equiv=Content-Security-Policy], script:not([type="application/ld+json"])',
    );
    return ordered.length > 1 && ordered[0]?.matches("meta");
  });
  expect(policyComesFirst).toBe(true);

  await page.evaluate(() => {
    const script = document.createElement("script");
    script.textContent = "document.documentElement.dataset.unlistedScript = 'ran'";
    document.body.append(script);
  });
  await expect(page.locator("html")).not.toHaveAttribute("data-unlisted-script", "ran");
});

test("security.txt is available under .well-known", async ({ request }) => {
  const response = await request.get("/.well-known/security.txt");
  expect(response.ok()).toBe(true);
  expect(await response.text()).toMatch(/^Contact: https:\/\//m);
});
