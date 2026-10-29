import assert from "node:assert/strict";
import { test } from "node:test";
import { relatedCards } from "../../src/data/projectSchema.ts";

const card = (id: string, builtWith: string[] = []) => ({ id, data: { title: id.toUpperCase(), builtWith } });

test("used by is derived from the other cards' built with", () => {
  const related = relatedCards([card("app", ["lint"]), card("lib", ["lint"]), card("lint")]);
  assert.deepEqual(related.get("app"), { builtWith: [{ id: "lint", title: "LINT" }], usedBy: [] });
  assert.deepEqual(related.get("lint")?.usedBy, [
    { id: "app", title: "APP" },
    { id: "lib", title: "LIB" },
  ]);
});

test("built with an unknown card fails", () => {
  assert.throws(() => relatedCards([card("app", ["lnit"])]), /app.*"lnit"/);
});
