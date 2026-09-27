import assert from "node:assert/strict";
import { test } from "node:test";
import { stepPaths } from "../../src/components/chartScale.ts";

// The `d` transition between measures only works if every measure yields the
// same command sequence; only the numbers may differ.
const commands = (d: string) => d.replace(/[^A-Za-z]/g, "");

test("each month holds flat across its column and the area closes on the baseline", () => {
  const { line, area } = stepPaths([80, 50], 10, 20, 100);
  assert.equal(line, "M10,80V80H30V50H50");
  assert.equal(area, "M10,100V80H30V50H50V100H10Z");
});

test("the command sequence depends on the month count, not the values", () => {
  const a = stepPaths([100, 100, 100], 0, 10, 100);
  const b = stepPaths([5, 60, 90], 0, 10, 100);
  assert.equal(commands(a.area), commands(b.area));
  assert.equal(commands(a.line), commands(b.line));
});
