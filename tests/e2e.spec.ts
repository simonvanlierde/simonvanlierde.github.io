import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";

// Read the export instead of restating it (see tests/cv.spec.ts).
const cv = parse(readFileSync("src/data/cv-public.yaml", "utf8"));
const codemeta = JSON.parse(readFileSync("src/data/codemeta.json", "utf8"));

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("renders the page shell: title, main landmark, single h1", async ({ page }) => {
  await expect(page).toHaveTitle(/Simon van Lierde/);
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Simon van Lierde");
});

// Check the complete page at narrow and wide viewport sizes.
for (const width of [320, 390, 900, 1200]) {
  test(`no page scrolls sideways at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ["/", "/cv/", "/archive/", "/no-such-page/"]) {
      await page.goto(path);
      const [scrollWidth, clientWidth] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(scrollWidth, `${path} at ${width}px`).toBeLessThanOrEqual(clientWidth);
    }
  });
}

test("the contact section links to the published profiles", async ({ page }) => {
  const footer = page.locator("#contact");
  const expected: Record<string, string> = {
    GitHub: cv.basics.links.github,
    LinkedIn: cv.basics.links.linkedin,
    ORCID: cv.basics.links.orcid,
    "Leiden profile": cv.basics.links.leiden,
  };
  for (const [name, href] of Object.entries(expected)) {
    await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  }
});

test("skip link is the first tab stop and lands before the h1", async ({ page }) => {
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toHaveAttribute("href", "#main");
  // The page heading belongs to the skip target.
  await expect(page.locator("#main").getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("the index keeps four featured projects and sends the rest to the archive", async ({ page }) => {
  await expect(page.locator(".bom-row--feature")).toHaveCount(4);
  await expect(page.locator("#project-bikespot")).toHaveCount(0);
  await page.getByRole("link", { name: "Project archive", exact: true }).click();
  await expect(page).toHaveURL(/\/archive\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Project archive");
  await expect(page.locator("#project-bikespot")).toBeVisible();
});

// The ranking is Simon's (2026-11-09): how widely the field uses each library.
const showcase = ["Brightway", "Activity Browser", "premise", "pymrio", "lca_algebraic", "flodym"];
const upstreamAnchor = (name: string) => `upstream-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

test("the index gives each upstream library one line that links to its archive entry", async ({ page }) => {
  const lines = page.locator("#upstream-heading ~ ul").first().locator("> li");
  await expect(lines).toHaveCount(showcase.length);
  for (const [i, name] of showcase.entries()) {
    const line = lines.nth(i);
    await expect(line.getByRole("link")).toHaveCount(1);
    await expect(line.locator("p")).toHaveCount(1);
    const link = line.getByRole("link", { name, exact: true });
    await expect(link).toHaveAttribute("href", `/archive/#${upstreamAnchor(name)}`);
    expect((await link.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  }
  await expect(page.getByRole("link", { name: "All upstream contributions and pull requests" })).toHaveAttribute(
    "href",
    "/archive/#upstream-heading",
  );
  await page.goto("/archive/");
  for (const name of showcase) await expect(page.locator(`#${upstreamAnchor(name)} h3`)).toHaveText(name);
});

test("published project fragments follow projects into the archive", async ({ page }) => {
  await page.goto("/#project-sourceledger");
  await expect(page).toHaveURL(/\/archive\/#project-sourceledger$/);
  await expect(page.locator("#project-sourceledger")).toBeInViewport();
  await page.goto("/");
  await page.evaluate(() => {
    location.hash = "project-bikespot";
  });
  await expect(page).toHaveURL(/\/archive\/#project-bikespot$/);
});

test("the archive retains software metadata and the thesis dataset in structured data", async ({ page }) => {
  await page.goto("/archive/");
  const graph = await page
    .locator('script[type="application/ld+json"]')
    .evaluate((el) => JSON.parse(el.textContent ?? "{}")["@graph"]);
  const code = graph.find((node: Record<string, unknown>) => node.name === "sourceledger");
  // The weekly refresh rewrites codemeta.json, so expect what it holds now.
  const meta = codemeta["https://github.com/simonvanlierde/sourceledger"];
  expect(code).toMatchObject({ "@type": "SoftwareSourceCode", version: meta.version, identifier: meta.doi });
  expect(graph.find((node: Record<string, unknown>) => node["@type"] === "Dataset")).toMatchObject({
    license: "https://spdx.org/licenses/CC-BY-4.0.html",
    url: "https://doi.org/10.5281/zenodo.8344580",
  });
});

test("upstream archive destinations stay below the sticky navigation", async ({ page }) => {
  await page.getByRole("link", { name: "lca_algebraic", exact: true }).click();
  const heading = page.locator("#upstream-lca-algebraic h3");
  await expect(heading).toBeInViewport();
  const top = (await heading.boundingBox())?.y ?? 0;
  const nav = await page.getByRole("navigation", { name: "Primary" }).boundingBox();
  expect(top).toBeGreaterThanOrEqual((nav?.y ?? 0) + (nav?.height ?? 0));
});

test("project titles open websites and keep source links, with repositories as the fallback", async ({ page }) => {
  for (const [id, website] of [
    ["jsonvet", "https://simonvanlierde.com/jsonvet/"],
    ["codemeta-drift", "https://simonvanlierde.com/codemeta-drift/"],
    ["brightway-benchmarks", "https://simonvanlierde.com/brightway-benchmarks/"],
    ["bikespot", "https://bikespot.duinlab.nl"],
    ["io-notebook", "https://simonvanlierde.com/io-notebook/"],
  ]) {
    await page.goto(id === "jsonvet" ? "/" : "/archive/");
    const row = page.locator(`#project-${id}`);
    await expect(row.getByRole("link", { name: id, exact: true })).toHaveAttribute("href", website);
    await expect(row.getByRole("link", { name: `Source for ${id}`, exact: true })).toHaveAttribute(
      "href",
      `https://github.com/simonvanlierde/${id}`,
    );
  }
  await page.goto("/archive/");
  await expect(
    page.locator("#project-project-templates").getByRole("link", { name: "project-templates", exact: true }),
  ).toHaveAttribute("href", "https://github.com/simonvanlierde/project-templates");
});

test("an unknown path serves the 404 page with a way back", async ({ page }) => {
  await page.goto("/no-such-page/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("That page does not exist");
  await expect(page.getByRole("link", { name: "Back to work" })).toHaveAttribute("href", "/");
});

test.describe("disassembly chart", () => {
  // The chart hydrates on scroll (client:visible). Astro drops `ssr` once it has
  // hydrated, so wait for that before interacting.
  test.beforeEach(async ({ page }) => {
    await page.locator("astro-island").scrollIntoViewIfNeeded();
    await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
  });

  test("the visually-hidden data table mirrors the plotted series", async ({ page }) => {
    // The hidden table is the accessible fallback, so it must match the plotted months.
    const rows = page.locator("table tbody tr");
    const columns = page.locator("rect.chart__hit");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    await expect(columns).toHaveCount(rowCount);

    const caption = page.locator("table caption");
    await expect(caption).toHaveText(/Products/i);

    const parts = page.getByRole("button", { name: "Components" });
    await parts.click();
    await expect(caption).toHaveText(/Components/i);
  });

  test("chart measure toggle updates pressed state and the accessible summary", async ({ page }) => {
    const chart = page.locator('svg[role="img"]');
    await expect(chart).toHaveAttribute("aria-label", /products/i);

    const parts = page.getByRole("button", { name: "Components" });
    await parts.click();
    await expect(parts).toHaveAttribute("aria-pressed", "true");

    await expect(chart).toHaveAttribute("aria-label", /components/i);
    await expect(page.getByRole("button", { name: "Products" })).toHaveAttribute("aria-pressed", "false");

    // Without the live region, a screen reader hears nothing when the measure switches.
    await expect(page.locator("[aria-live=polite]")).toHaveText(/^Components: /);
  });

  test("arrow keys walk the tooltip, which never blocks the pointer", async ({ page }) => {
    // Sighted keyboard users read exact values here; the hidden table serves screen readers.
    const chart = page.locator('svg[role="img"]');
    await chart.focus();
    const tip = page.locator(".chart__tip-title");
    const first = await tip.textContent();
    expect(first).toBeTruthy();

    await page.keyboard.press("ArrowRight");
    await expect(tip).not.toHaveText(first ?? "");
    await page.keyboard.press("Home");
    await expect(tip).toHaveText(first ?? "");

    // The tooltip covers the hit rects; without pointer-events:none it swallows hovers.
    const labels = await page.locator("table tbody tr th").allTextContents();
    const hits = page.locator("rect.chart__hit");
    const last = (await hits.count()) - 1;
    await hits.nth(last).hover();
    await expect(tip).toHaveText(labels[last]);
  });

  test("month labels never overlap on a phone, and the latest keeps its label", async ({ page }) => {
    // Overlapping labels read as one word.
    await page.setViewportSize({ width: 390, height: 844 });
    const boxes = await page.locator("text.chart__xlabel").evaluateAll((els) =>
      els
        .filter((el) => getComputedStyle(el).display !== "none")
        .map((el) => el.getBoundingClientRect())
        .map((r) => ({ left: r.left, right: r.right })),
    );
    expect(boxes.length).toBeGreaterThan(1);
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].left, `label ${i} overlaps label ${i - 1}`).toBeGreaterThanOrEqual(boxes[i - 1].right);
    }
    await expect(page.locator("text.chart__xlabel").last()).toBeVisible();
  });

  test("secondary chart measures use progressive disclosure", async ({ page }) => {
    // The button relabels itself, so locate it by element, not by name.
    const more = page.locator("button.chart__more");
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await expect(more).toHaveAccessibleName("Show more measures");
    await expect(page.getByRole("button", { name: "Mass" })).toBeHidden();

    await more.click();
    await expect(more).toHaveAttribute("aria-expanded", "true");
    await expect(more).toHaveAccessibleName("Show fewer measures");
    const images = page.getByRole("button", { name: "Mass" });
    await expect(images).toBeVisible();
    await images.click();
    await expect(images).toHaveAttribute("aria-pressed", "true");

    await more.click();
    await expect(page.getByRole("button", { name: /Mass selected\. Show more measures/ })).toBeVisible();
  });
});

// Digit-bearing names the regions contain, not counts. Drop an entry once the
// name leaves the page.
const names = [
  "Vue 3",
  "JSON5",
  "check-json5",
  "JATS4R",
  "AI4IE",
  "SHA-256",
  "R9lab",
  "bw2calc 3.0.0",
  // A Dutch tax category, not a figure.
  "Box 3",
  "3.1.0",
  // The sentence lists the three itself.
  "written three times: in bash, Python and Rust",
  "All three",
];

// Number words count as numbers too. "one" is left out on purpose: every use is idiom.
const NUMBER_WORD = "(?:two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozen|hundreds?|thousands?|million)";

for (const route of ["/", "/archive/"]) {
  test(`every number in notes and project descriptions on ${route} has a source and a date`, async ({ page }) => {
    await page.goto(route);
    const selectors = route === "/" ? [".notes__list", ".bom-row__desc"] : [".bom-row__desc"];
    for (const sel of selectors) await expect(page.locator(sel).first()).toBeVisible();
    const regions = page.locator(selectors.join(", "));
    await expect(page.locator(".notes__list [data-source]")).toHaveCount(route === "/" ? 4 : 0);

    for (const figure of await regions.locator("[data-source]").all()) {
      await expect(figure).toHaveText(new RegExp(`^\\s*(?:\\d[\\d.,\\s]*%?|${NUMBER_WORD})\\s*$`, "i"));
      await expect(figure).toHaveAttribute("data-source", /^https:\/\/\S+$/);
      await expect(figure).toHaveAttribute("data-as-of", /^\d{4}-\d{2}-\d{2}$/);
    }

    // Text left once the sourced figures and the dates are taken out.
    const rest = (
      await regions.evaluateAll((els) =>
        els.map((el) => {
          const copy = el.cloneNode(true) as Element;
          for (const n of copy.querySelectorAll("[data-source], time[datetime]")) n.remove();
          return copy.textContent ?? "";
        }),
      )
    ).join("\n");

    const bare = names.reduce((text, name) => text.replaceAll(name, ""), rest);
    expect(bare.match(new RegExp(`\\d[\\d,.]*|\\b${NUMBER_WORD}\\b`, "gi")) ?? []).toEqual([]);
  });
}

test("archive route, nav and cross references reach real project rows", async ({ page, request }) => {
  expect((await request.get("/archive/")).status()).toBe(200);
  await page.goto("/archive/");
  await expect(
    page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Work", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://simonvanlierde.com/archive/");
  for (const path of ["/", "/archive/"]) {
    await page.goto(path);
    const links = await page.locator("a.ref").evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
    for (const href of new Set(links)) {
      const url = new URL(href, page.url());
      await page.goto(url.pathname);
      await expect(page.locator(url.hash)).toHaveCount(1);
    }
  }
});

test("featured projects show cached release metadata with named links", async ({ page }) => {
  for (const id of ["jsonvet", "credit-matrix", "ramascene-explorer"]) {
    const row = page.locator(`#project-${id}`);
    await expect(row.locator(".project-metadata")).toBeVisible();
    await expect(row.getByRole("link", { name: `DOI for ${id}`, exact: true })).toHaveAttribute(
      "href",
      /^https:\/\/doi.org\//,
    );
  }
});

for (const width of [320, 390]) {
  test(`archive navigation and upstream anchors stay clear at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const theme of ["dark", "light"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const archive = page.getByRole("link", { name: "Project archive", exact: true });
      await archive.click();
      await expect(page).toHaveURL(/\/archive\/$/);
      await page.goto("/");
    }
    await page.getByRole("link", { name: "Brightway", exact: true }).click();
    await expect(page).toHaveURL(/\/archive\/#upstream-brightway$/);
    await expect
      .poll(() =>
        page
          .locator("#upstream-brightway h3")
          .evaluate(
            (el) =>
              el.getBoundingClientRect().top -
              (document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0),
          ),
      )
      .toBeGreaterThanOrEqual(0);
  });
}

// A broken social card has no visible symptom on the page itself.
for (const path of ["/", "/cv/", "/archive/", "/notes/", "/notes/hub-and-spoke-observability/", "/privacy/"]) {
  test(`${path} names a social card that is served as a 1200x630 PNG`, async ({ page, request }) => {
    await page.goto(path);
    const og = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(og).toMatch(/^https:\/\/simonvanlierde\.com\//);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    const res = await request.get(new URL(og ?? "").pathname);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    const body = await res.body();
    // PNG width and height sit at bytes 16-23 of the IHDR chunk.
    expect([body.readUInt32BE(16), body.readUInt32BE(20)]).toEqual([1200, 630]);
  });
}

test("every featured card's close-up loads", async ({ page }) => {
  await page.goto("/");
  const shots = page.locator(".bom-row__shot img");
  expect(await shots.count()).toBeGreaterThan(0);
  for (const img of await shots.all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBeGreaterThan(0);
  }
});

// The project sites other repos publish under this domain come from the cards' demo links,
// so a card that moves its demo off the domain drops out, and this list says which must stay.
test("the sitemap lists every project site under this domain", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const locs = [...xml.matchAll(/<loc>https:\/\/simonvanlierde\.com\/([a-z0-9-]+)\/<\/loc>/g)].map((m) => m[1]);
  const sheets = ["cv", "archive", "notes", "privacy"];
  expect(locs.filter((l) => !sheets.includes(l)).sort()).toEqual([
    "brightway-benchmarks",
    "citesync",
    "codemeta-drift",
    "cv-ie-taxonomy",
    "io-notebook",
    "jsonvet",
    "msc-thesis-ie",
    "ramascene-explorer",
    "sourceledger",
    "vuurtoren",
  ]);
});
