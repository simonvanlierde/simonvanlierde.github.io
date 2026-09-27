import assert from "node:assert/strict";
import { test } from "node:test";
import { barPath, ZERO_STUB } from "../../src/components/chartScale.ts";

// The `d` transition between measures only works if every path has the same
// command sequence; a special case for short or zero bars would break it.
function commands(d: string) {
  return d.replace(/[^A-Za-z]/g, "");
}

test("bars open and close on the baseline", () => {
  const d = barPath(50, 20, 100, 200);
  assert.equal(d, "M40,200V100H60V200Z");
});

test("a zero value still draws a visible stub, not nothing", () => {
  const d = barPath(50, 20, 200, 200); // top === base
  assert.equal(commands(d), commands(barPath(50, 20, 100, 200)), "same command sequence");
  // The stub rises ZERO_STUB above the baseline: an empty period reads as zero.
  assert.equal(d, `M40,200V${200 - ZERO_STUB}H60V200Z`);
});
