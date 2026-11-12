import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("project citations open by keyboard and their downloads contain real citation data", async ({ page, request }) => {
  await page.goto("/");
  const citation = page.locator("#project-credit-matrix .project-citation");
  const summary = citation.locator("summary");
  await expect(summary).toHaveText("Cite this software (credit-matrix)");
  await expect(citation.locator(".citation-text")).toBeHidden();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(citation.locator(".citation-text")).toContainText("CRediT Matrix");

  const downloads: Record<string, string> = {};
  for (const format of ["APA", "BibTeX", "CSL-JSON", "JSON-LD"]) {
    const link = citation.getByRole("link", { name: `Download ${format} citation for credit-matrix`, exact: true });
    const href = await link.getAttribute("href");
    expect(href).toMatch(/^\/citations\/credit-matrix\//);
    const response = await request.get(href ?? "");
    expect(response.status()).toBe(200);
    downloads[format] = await response.text();
  }
  expect(downloads.BibTeX).toContain("@software{");
  const csl = JSON.parse(downloads["CSL-JSON"]);
  expect((Array.isArray(csl) ? csl[0] : csl).type).toBe("software");
  expect(JSON.parse(downloads["JSON-LD"])["@type"]).toBe("SoftwareSourceCode");
  expect(downloads.APA.trim()).toBe((await citation.locator(".citation-text").textContent())?.trim());
  const recordLink = citation.getByRole("link", { name: "Source record for credit-matrix CodeMeta", exact: true });
  const recordResponse = await request.get((await recordLink.getAttribute("href")) ?? "");
  expect(recordResponse.status()).toBe(200);
  const records = (await recordResponse.text())
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  expect(records.at(-1).sha256).toMatch(/^[a-f0-9]{64}$/);
  await page.keyboard.press("Enter");
  await expect(citation.locator(".citation-text")).toBeHidden();
});

for (const theme of ["light", "dark"]) {
  test(`expanded citations remain accessible at phone width (${theme})`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
    await page.goto("/");
    await page.locator("#project-credit-matrix .project-citation summary").click();
    const { violations } = await new AxeBuilder({ page }).include("#project-credit-matrix").analyze();
    expect(violations.map((violation) => violation.id)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
}

test("citations and recorded R9lab sources work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("/");
    const citation = page.locator("#project-credit-matrix .project-citation");
    await citation.locator("summary").click();
    await expect(citation.locator(".citation-text")).toContainText("CRediT Matrix");
    for (const label of ["R9lab totals", "R9lab monthly series"]) {
      const link = page.getByRole("link", { name: `Source record for ${label}`, exact: true });
      await expect(link).toHaveAttribute("href", /^\/provenance\/r9lab-/);
    }
    const response = await context.request.get("/CITATION.cff");
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain("cff-version: 1.2.0");
  } finally {
    await context.close();
  }
});
