import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSocialCard } from "../../scripts/cards.mjs";

const page = "https://simonvanlierde.com/msc-thesis-ie/";

test("reads og:image", () => {
  const html = `<meta property="og:image" content="https://example.org/og.png">
    <meta property="og:image:alt" content="A map of flows">`;
  assert.equal(parseSocialCard(html, page), "https://example.org/og.png");
});

test("resolves a relative og:image against the page", () => {
  assert.equal(parseSocialCard(`<meta property="og:image" content="./og.png" />`, page), `${page}og.png`);
});

test("reads a tag split over lines with content first", () => {
  const html = `<meta\n  content="https://example.org/shot.png"\n  property="og:image"\n/>`;
  assert.equal(parseSocialCard(html, page), "https://example.org/shot.png");
});

test("does not take og:image:width for og:image", () => {
  assert.equal(parseSocialCard(`<meta property="og:image:width" content="1200">`, page), null);
});
