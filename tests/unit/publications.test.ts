import assert from "node:assert/strict";
import { test } from "node:test";
import { listablePublications, PublicationSchema } from "../../src/data/publications.ts";

const pub = (over: Record<string, unknown> = {}) =>
  PublicationSchema.parse({
    authors: ["S. van Lierde"],
    title: "A paper",
    venue: "A journal",
    year: 2026,
    ...over,
  });

test("accepted work always lists", () => {
  assert.equal(listablePublications([pub()]).length, 1);
  assert.equal(listablePublications([pub({ status: "in press" })]).length, 1);
  // No DOI yet is normal for accepted-but-unpublished work; it still lists.
  assert.equal(listablePublications([pub({ status: "in press", doi: undefined })]).length, 1);
});

test("unaccepted work lists only once a preprint DOI exists", () => {
  assert.deepEqual(listablePublications([pub({ status: "under review" })]), []);
  assert.deepEqual(listablePublications([pub({ status: "preprint" })]), []);
  assert.equal(listablePublications([pub({ status: "under review", doi: "10.5281/zenodo.1" })]).length, 1);
});

test("status defaults to published, so an entry is never accidentally hidden", () => {
  assert.equal(pub().status, "published");
});

test("authors accept a YAML list or one comma-joined string", () => {
  assert.deepEqual(pub({ authors: ["A. One", "B. Two"] }).authors, ["A. One", "B. Two"]);
  assert.deepEqual(pub({ authors: "A. One, B. Two" }).authors, ["A. One", "B. Two"]);
  // A trailing separator upstream must not produce an empty byline entry.
  assert.deepEqual(pub({ authors: "A. One, " }).authors, ["A. One"]);
});

test("an unrecognised status fails the build rather than rendering a stray label", () => {
  assert.throws(() => pub({ status: "submitted" }));
});
