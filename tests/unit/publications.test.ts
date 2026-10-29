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

test("authors accept a YAML list of names or an APA byline", () => {
  assert.deepEqual(pub({ authors: ["A. One", "B. Two"] }).authors, ["A. One", "B. Two"]);
  // The two bylines the export carries, verbatim.
  assert.deepEqual(pub({ authors: "van Lierde, S" }).authors, ["S. van Lierde"]);
  assert.deepEqual(
    pub({
      authors:
        "Rankin, K. H., Donati, F., Tu, Q., Ward-Bond, J., Reitz, N., Hiser, B., van Lierde, S., Suh, S., Saxe, S., Posen, I. D., & Hawes, J. K",
    }).authors,
    [
      "K. H. Rankin",
      "F. Donati",
      "Q. Tu",
      "J. Ward-Bond",
      "N. Reitz",
      "B. Hiser",
      "S. van Lierde",
      "S. Suh",
      "S. Saxe",
      "I. D. Posen",
      "J. K. Hawes",
    ],
  );
  // A trailing separator upstream must not produce an empty byline entry.
  assert.deepEqual(pub({ authors: "One, A., " }).authors, ["A. One"]);
  // Full names joined by commas are not APA: fail rather than pair them up wrong.
  assert.throws(() => pub({ authors: "A. One, B. Two" }), /not an APA byline/);
  // APA 7 elides authors 20 onwards with "...": no full list, so no names.
  assert.throws(() => pub({ authors: "Rankin, K. H., ... Hawes, J. K" }), /not an APA byline/);
  // Initials outside ASCII, and initials run together.
  assert.deepEqual(pub({ authors: "Müller, Ö., & Łukasz, Ł" }).authors, ["Ö. Müller", "Ł. Łukasz"]);
  assert.deepEqual(pub({ authors: "Hawes, JK" }).authors, ["J. K. Hawes"]);
});

test("an unrecognised status fails the build rather than rendering a stray label", () => {
  assert.throws(() => pub({ status: "submitted" }));
});

test("a DOI must be the bare identifier: both consumers prefix the resolver", () => {
  assert.equal(pub({ doi: "10.5281/zenodo.1" }).doi, "10.5281/zenodo.1");
  // A full URL upstream would render https://doi.org/https://doi.org/... .
  assert.throws(() => pub({ doi: "https://doi.org/10.5281/zenodo.1" }));
  assert.throws(() => pub({ doi: "doi:10.5281/zenodo.1" }));
});
