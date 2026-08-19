import assert from "node:assert/strict";
import { test } from "node:test";
import { BAR_RADIUS, barPath, ZERO_STUB } from "../../src/components/chartScale.ts";

// The `d` transition between measures only works if every path has the same
// command sequence; a special case for short or zero bars would break it.
function commands(d: string) {
  return d.replace(/[^A-Za-z]/g, "");
}

test("bars open and close on the baseline, with the arcs at the data end", () => {
  const d = barPath(50, 20, 100, 200);
  // Starts and ends on the baseline (y=200), with no arc there.
  assert.match(d, /^M40,200V/, "opens at the left foot, on the baseline");
  assert.match(d, /V200Z$/, "closes back down to the baseline");
  assert.equal((d.match(/a/g) ?? []).length, 2, "two arcs, both at the data end");
});

test("a zero value still draws a visible stub, not nothing", () => {
  const d = barPath(50, 20, 200, 200); // top === base
  assert.equal(commands(d), commands(barPath(50, 20, 100, 200)), "same command sequence");
  // The stub rises ZERO_STUB above the baseline: an empty period reads as zero.
  assert.ok(d.includes(`M40,200V${200 - ZERO_STUB + Math.min(BAR_RADIUS, ZERO_STUB)}`));
});

test("the corner radius collapses rather than overflowing a short or narrow bar", () => {
  for (const [w, top, base] of [
    [20, 197, 200], // shorter than any radius
    [3, 100, 200], // narrower than 2 x any radius
    [20, 100, 200], // roomy: the full radius applies
  ] as const) {
    const d = barPath(50, w, top, base);
    const r = Number(d.match(/a([\d.]+),/)?.[1]);
    assert.ok(r >= 0, `radius is never negative (w=${w})`);
    assert.ok(r <= BAR_RADIUS, `radius never exceeds BAR_RADIUS (w=${w})`);
    assert.ok(r <= w / 2, `radius never exceeds half the width (w=${w})`);
    assert.ok(r <= Math.max(base - top, ZERO_STUB), `radius never exceeds the height (w=${w})`);
    assert.equal(commands(d), "MVaHaVZ", "command sequence is invariant");
  }
});
