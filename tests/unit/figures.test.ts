import assert from "node:assert/strict";
import { test } from "node:test";
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

test("a placeholder named like an Object property is not a figure", () => {
  assert.throws(() => figureParts("{constructor}"), /\{constructor\}/);
});
