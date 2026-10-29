import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSocialCard } from "../../scripts/cards.mjs";

const page = "https://simonvanlierde.com/msc-thesis-ie/";

test("reads og:image and its alt text", () => {
  const html = `<meta property="og:image" content="https://example.org/og.png">
    <meta property="og:image:alt" content="A map of flows">`;
  assert.deepEqual(parseSocialCard(html, page), { url: "https://example.org/og.png", alt: "A map of flows" });
});

test("resolves a relative og:image against the page", () => {
  assert.equal(parseSocialCard(`<meta property="og:image" content="./og.png" />`, page)?.url, `${page}og.png`);
});

test("reads a tag split over lines with content first", () => {
  const html = `<meta\n  content="https://example.org/shot.png"\n  property="og:image"\n/>`;
  assert.deepEqual(parseSocialCard(html, page), { url: "https://example.org/shot.png", alt: "" });
});

test("does not take og:image:width for og:image", () => {
  assert.equal(parseSocialCard(`<meta property="og:image:width" content="1200">`, page), null);
});
