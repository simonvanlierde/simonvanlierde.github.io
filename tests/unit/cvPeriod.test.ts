import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDate, formatPeriod } from "../../src/components/cvPeriod.ts";

test("month precision renders an abbreviated month before the year", () => {
  assert.equal(formatDate("2024-04"), "Apr 2024");
  assert.equal(formatDate("2023-09"), "Sep 2023");
  // Month 12 must not fall off the end of the lookup table.
  assert.equal(formatDate("2021-12"), "Dec 2021");
});

test("year precision passes the year straight through", () => {
  assert.equal(formatDate("2018"), "2018");
});

test("the open-ended sentinel becomes a capitalised word, not a date", () => {
  assert.equal(formatDate("present"), "Present");
});

test("a period joins both ends with an en dash", () => {
  assert.equal(formatPeriod("2024-04", "present"), "Apr 2024 – Present");
  assert.equal(formatPeriod("2018", "2023"), "2018 – 2023");
});
