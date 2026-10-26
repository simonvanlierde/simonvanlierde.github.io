import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { figureText, type ProjectCard, projectNodes } from "../../src/data/projectSchema.ts";

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
      (n) => n["@id"] === `https://simonvanlierde.github.io/#project-${card.id}`,
    );
    assert.ok(node, `${card.id} has no SoftwareSourceCode node`);
    assert.equal(node.name, card.data.title);
    assert.equal(node.description, figureText(card.data.description, card.data.figures));
    assert.doesNotMatch(String(node.description), /\{\w+\}/);
    assert.equal(node.codeRepository, card.data.repo);
    assert.ok(node.author);
  }
  assert.equal(ofType("SoftwareSourceCode").length, cards.length);
});

test("only cards with a dataset link yield a Dataset, with name, description and url", () => {
  const withDataset = cards.filter((c) => c.data.links.some((l) => /dataset/i.test(l.label)));
  assert.ok(withDataset.length > 0, "no card links a dataset any more: the Dataset path is untested");
  const datasets = ofType("Dataset");
  assert.equal(datasets.length, withDataset.length);
  // A fixed card, so a wrong label pattern cannot pass by agreeing with itself.
  assert.ok(datasets.some((n) => n["@id"] === "https://simonvanlierde.github.io/#dataset-msc-thesis-ie"));
  for (const node of datasets) {
    for (const key of ["name", "description", "url"]) assert.ok(node[key], `Dataset lacks ${key}`);
  }
});

test("node ids are unique and the output serialises", () => {
  const ids = nodes.map((n) => n["@id"]);
  assert.equal(new Set(ids).size, ids.length);
  JSON.parse(JSON.stringify(nodes));
});
