import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { ProjectSchema, validateProjectGraph } from "../../src/data/projectSchema.ts";

const minimal = () => ({
  title: "Example",
  description: "A research tool.",
  repo: "https://example.org/code",
  kind: "tool",
  layer: "software",
  threads: ["built-to-scale-and-last"],
});
const card = (id: string, data = {}) => ({ id, data: ProjectSchema.parse({ ...minimal(), ...data }) });

test("project schema requires a layer and thread and rejects unknown fields", () => {
  assert.ok(ProjectSchema.safeParse(minimal()).success);
  for (const change of [
    { layer: undefined },
    { threads: [] },
    { threads: ["unknown"] },
    { uses: [] },
    { cluster: "apps" },
  ]) {
    assert.ok(!ProjectSchema.safeParse({ ...minimal(), ...change }).success);
  }
  assert.ok(
    !ProjectSchema.safeParse({
      ...minimal(),
      extracts: [
        { reservoir: "products", stock: 93, unit: "products", source: "https://example.org", as_of: "yesterday" },
      ],
    }).success,
  );
});

test("dependencies resolve against cards and upstream libraries and reject cycles", () => {
  validateProjectGraph([card("app", { builds_on: ["library", "IndEcol/pymrio"] }), card("library")]);
  for (const field of ["builds_on", "tooling", "fixes"]) {
    assert.throws(() => validateProjectGraph([card("app", { [field]: ["missing"] })]), /app.*missing/);
  }
  assert.throws(() => validateProjectGraph([card("app", { builds_on: ["app"] })]), /app.*itself/);
  assert.throws(
    () =>
      validateProjectGraph([
        card("a", { builds_on: ["b"] }),
        card("b", { builds_on: ["c"] }),
        card("c", { builds_on: ["a"] }),
      ]),
    /cycle.*a.*b.*c.*a/,
  );
  assert.throws(() => validateProjectGraph([card("a", { tooling: ["b", "b"] }), card("b")]), /a.*b.*twice/);
  assert.throws(() => validateProjectGraph([card("a", { fixes: ["b"] }), card("b")]), /a.*fixes.*b/);
});

test("all published cards satisfy the confirmed graph and preserve dataset licensing", () => {
  const dir = resolve(import.meta.dirname, "../../src/content/projects");
  const cards = readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => ({
      id: name.slice(0, -3),
      data: ProjectSchema.parse(parse(readFileSync(resolve(dir, name), "utf8").split(/^---$/m)[1])),
    }));
  validateProjectGraph(cards);
  const data = (id: string) => {
    const entry = cards.find((candidate) => candidate.id === id);
    assert.ok(entry, id);
    return entry.data;
  };
  assert.deepEqual(data("r9lab").builds_on, ["cv-ie-taxonomy"]);
  assert.ok(data("r9lab").tooling.includes("monitoring"));
  assert.deepEqual(data("msc-thesis-ie").builds_on, []);
  assert.deepEqual(data("io-notebook").builds_on, []);
  assert.deepEqual(data("ramascene-explorer").serves, ["researchers"]);
  assert.deepEqual(data("brightway-benchmarks").serves, ["builders", "researchers"]);
  assert.equal(
    data("msc-thesis-ie").links.find((link) => /dataset/i.test(link.label))?.license,
    "https://spdx.org/licenses/CC-BY-4.0.html",
  );
});
