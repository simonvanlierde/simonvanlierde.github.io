import assert from "node:assert/strict";
import { test } from "node:test";
import { relatedCards } from "../../src/data/projectSchema.ts";

const card = (id: string, tooling: string[] = []) => ({
  id,
  data: { title: id.toUpperCase(), tooling, builds_on: [], fixes: [] },
});

test("reverse tooling links are derived from the other cards", () => {
  const related = relatedCards([card("app", ["lint"]), card("lib", ["lint"]), card("lint")]);
  assert.deepEqual(related.get("app"), { tooling: [{ id: "lint", title: "LINT" }], toolingFor: [] });
  assert.deepEqual(related.get("lint")?.toolingFor, [
    { id: "app", title: "APP" },
    { id: "lib", title: "LIB" },
  ]);
});

test("using an unknown card fails", () => {
  assert.throws(() => relatedCards([card("app", ["lnit"])]), /app.*"lnit"/);
});

test("a card using itself or the same card twice fails", () => {
  assert.throws(() => relatedCards([card("app", ["app"])]), /app.*itself/);
  assert.throws(() => relatedCards([card("app", ["lint", "lint"]), card("lint")]), /app.*"lint".*twice/);
});
