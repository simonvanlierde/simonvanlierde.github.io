import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { type ProjectCard, projectNodes } from "../../src/data/projectSchema.ts";

const dir = resolve(import.meta.dirname, "../../src/content/projects");

// The content collection's defaults (tags, links) applied by hand: astro:content
// is not available outside Astro.
const cards: ProjectCard[] = readdirSync(dir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const data = parse(readFileSync(join(dir, f), "utf8").match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "");
    return { id: f.replace(/\.md$/, ""), data: { tags: [], links: [], ...data } };
  });

const nodes = projectNodes(cards) as Record<string, unknown>[];
const ofType = (type: string) => nodes.filter((n) => n["@type"] === type);

test("there are cards to check", () => {
  assert.ok(cards.length > 0);
});

test("every card yields a SoftwareSourceCode node with name, description and codeRepository", () => {
  for (const card of cards) {
    const node = ofType("SoftwareSourceCode").find(
      (n) => n["@id"] === `https://simonvanlierde.com/#project-${card.id}`,
    );
    assert.ok(node, `${card.id} has no SoftwareSourceCode node`);
    assert.equal(node.name, card.data.title);
    assert.equal(node.codeRepository, card.data.repo);
    assert.ok(node.author);
  }
  assert.equal(ofType("SoftwareSourceCode").length, cards.length);
});

test("a card's description has its figures filled in", () => {
  const jsonvet = nodes.find((n) => n["@id"] === "https://simonvanlierde.com/#project-jsonvet");
  assert.equal(
    jsonvet?.description,
    "A pre-commit hook and Rust library that checks JSON, JSONC, JSON5 and other JSON dialects for syntax errors and duplicate keys. I rewrote it from Python in Rust and released 2.0 on PyPI and crates.io. It gives the same verdicts as the Python version on all 40,228 file-by-file comparisons with version 1.4.1.",
  );
});

test("only cards with a dataset link yield a Dataset, with name, description, url and license", () => {
  const withDataset = cards.filter((c) => c.data.links.some((l) => /dataset/i.test(l.label)));
  assert.ok(withDataset.length > 0, "no card links a dataset any more: the Dataset path is untested");
  const datasets = ofType("Dataset");
  assert.equal(datasets.length, withDataset.length);
  // A fixed card, so a wrong label pattern cannot pass by agreeing with itself.
  assert.ok(datasets.some((n) => n["@id"] === "https://simonvanlierde.com/#dataset-msc-thesis-ie"));
  for (const node of datasets) {
    for (const key of ["name", "description", "url", "license"]) assert.ok(node[key], `Dataset lacks ${key}`);
  }
});

test("a dataset link without a license fails", () => {
  const card = {
    id: "x",
    data: {
      title: "x",
      description: "x",
      repo: "https://x.test",
      tags: [],
      links: [{ label: "dataset", url: "https://x.test" }],
    },
  };
  assert.throws(() => projectNodes([card]), /x: the "dataset" link has no license/);
});

test("node ids are unique and the output serialises", () => {
  const ids = nodes.map((n) => n["@id"]);
  assert.equal(new Set(ids).size, ids.length);
  JSON.parse(JSON.stringify(nodes));
});
