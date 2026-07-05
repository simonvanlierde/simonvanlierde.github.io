import assert from "node:assert/strict";
import { test } from "node:test";
import { buildScale } from "../../src/components/chartScale.ts";

// The documented reason the integer path exists: a whole-count max of 2 must
// give 0,1,2 — not 0,0.5,1,1.5,2, which round to a duplicated "0,1,1,2,2".
test("integer measures never produce fractional ticks (max 2 -> 0,1,2)", () => {
  assert.deepEqual(buildScale(2, true), { yMax: 2, ticks: [0, 1, 2] });
});

test("fractional measures keep fractional steps (max 2 -> 0,0.5,...,2)", () => {
  assert.deepEqual(buildScale(2, false).ticks, [0, 0.5, 1, 1.5, 2]);
});

test("axis is a nice 1/2/5 x 10^n scale that covers the data max", () => {
  for (const max of [1, 7, 37, 250, 1000, 4321]) {
    const { yMax, ticks } = buildScale(max, true);
    assert.equal(ticks[0], 0, "starts at 0");
    assert.equal(ticks.at(-1), yMax, "ends at yMax");
    assert.ok(yMax >= max, "covers the data max");
    assert.ok(ticks.every(Number.isInteger), "integer ticks");

    const step = ticks[1] - ticks[0];
    const leading = step / 10 ** Math.floor(Math.log10(step));
    assert.ok([1, 2, 5].includes(leading), `step ${step} is 1/2/5 x 10^n`);
    for (let i = 1; i < ticks.length; i++) {
      assert.equal(ticks[i] - ticks[i - 1], step, "evenly spaced");
    }
  }
});
