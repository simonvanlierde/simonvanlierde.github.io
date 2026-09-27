import assert from "node:assert/strict";
import { test } from "node:test";
import { formatCount, runningTotals } from "../../src/components/chartScale.ts";

const row = (period: string, teardowns: number, users: number) => ({ period, label: period, teardowns, users });

test("running totals end on the payload totals and skip the idle lead-in", () => {
  const rows = [row("2025-06", 0, 3), row("2025-07", 2, 1), row("2025-08", 0, 0), row("2025-09", 5, 2)];
  const out = runningTotals(rows, ["teardowns", "users"], { teardowns: 7, users: 6 }, "teardowns");
  assert.deepEqual(
    out.map((r) => r.period),
    ["2025-07", "2025-08", "2025-09"],
  );
  assert.deepEqual(
    out.map((r) => r.total),
    [
      { teardowns: 2, users: 4 },
      { teardowns: 2, users: 4 },
      { teardowns: 7, users: 6 },
    ],
  );
});

test("a series with no activity keeps every month", () => {
  const rows = [row("2025-06", 0, 1), row("2025-07", 0, 0)];
  assert.equal(runningTotals(rows, ["teardowns"], { teardowns: 0 }, "teardowns").length, 2);
});

test("counts use a thin space for thousands", () => {
  assert.equal(formatCount(1779), "1 779");
});
