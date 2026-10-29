import assert from "node:assert/strict";
import { test } from "node:test";
import { relatedCards } from "../../src/data/projectSchema.ts";

const card = (id: string, uses: string[] = []) => ({ id, data: { title: id.toUpperCase(), uses } });

test("used by is derived from the other cards' uses", () => {
  const related = relatedCards([card("app", ["lint"]), card("lib", ["lint"]), card("lint")]);
  assert.deepEqual(related.get("app"), { uses: [{ id: "lint", title: "LINT" }], usedBy: [] });
  assert.deepEqual(related.get("lint")?.usedBy, [
    { id: "app", title: "APP" },
    { id: "lib", title: "LIB" },
  ]);
});

test("using an unknown card fails", () => {
  assert.throws(() => relatedCards([card("app", ["lnit"])]), /app.*"lnit"/);
});
