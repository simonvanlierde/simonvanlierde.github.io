import assert from "node:assert/strict";
import { test } from "node:test";
import { indexDated, participants } from "../../src/data/figures.ts";
import { figureParts, figureText } from "../../src/data/projectSchema.ts";

const rooms = { value: "200", source: "https://example.org/capacity", as_of: "2026-10-21" };

test("placeholders become figures, text around them stays", () => {
  assert.deepEqual(figureParts("holds {rooms} rooms", { rooms }), ["holds ", rooms, " rooms"]);
  assert.equal(figureText("{rooms} rooms, {rooms} again", { rooms }), "200 rooms, 200 again");
  assert.deepEqual(figureParts("no numbers"), ["no numbers"]);
});

test("a placeholder without a figure fails", () => {
  assert.throws(() => figureParts("holds {room} rooms", { rooms }), /\{room\}/);
});

test("a figure the text never uses fails", () => {
  assert.throws(() => figureParts("holds 200 rooms", { rooms }), /rooms/);
});

test("a stray brace fails", () => {
  assert.throws(() => figureParts("holds {rooms rooms", { rooms }), /stray brace in "holds \{rooms rooms"/);
});

test("a placeholder named like an Object property is not a figure", () => {
  assert.throws(() => figureParts("{constructor}"), /\{constructor\}/);
});

test("the index is dated by its newest input, a card figure included", () => {
  const card = (as_of: string) => ({ data: { figures: { n: { value: "1", source: "https://example.org", as_of } } } });
  assert.equal(indexDated("2026-10-29", "2026-10-26", [card("2026-11-01"), card("2026-10-01")]), "2026-11-01");
  assert.equal(indexDated(undefined, "2026-10-26", [{ data: {} }]), "2026-10-26");
  assert.equal(indexDated(undefined, "2000-01-01", []), participants.as_of);
});
