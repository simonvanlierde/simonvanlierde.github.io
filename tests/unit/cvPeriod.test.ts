import assert from "node:assert/strict";
import { test } from "node:test";
import { CV_DATE, formatDate, formatPeriod } from "../../src/components/cvPeriod.ts";

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

test("the export contract accepts YYYY, YYYY-MM and present, nothing else", () => {
  for (const ok of ["2018", "2024-04", "2021-12", "present"]) assert.match(ok, CV_DATE);
  for (const bad of ["2024-13", "2024-00", "2024-1", "2024-1x", "Present", "24-04", ""]) {
    assert.doesNotMatch(bad, CV_DATE);
  }
});
