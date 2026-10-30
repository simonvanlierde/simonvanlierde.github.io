import assert from "node:assert/strict";
import { test } from "node:test";
import { closeUp, parseSocialCard } from "../../scripts/cards.mjs";

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

const card = { width: 1200, height: 630 };

test("a close-up without a focus is the card's centre at 4:3, as tall as the card", () => {
  assert.deepEqual(closeUp(card), { left: 180, top: 0, width: 840, height: 630 });
});

test("zoom narrows the close-up around its focus", () => {
  assert.deepEqual(closeUp(card, { x: 0.5, y: 0.5, zoom: 2 }), { left: 300, top: 90, width: 600, height: 450 });
});

test("a focus near an edge keeps the close-up inside the card", () => {
  assert.deepEqual(closeUp(card, { x: 1, y: 0, zoom: 2 }), { left: 600, top: 0, width: 600, height: 450 });
});
