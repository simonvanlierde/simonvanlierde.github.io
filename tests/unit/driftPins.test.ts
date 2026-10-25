import assert from "node:assert/strict";
import { test } from "node:test";
import { runDrift } from "./driftRun.ts";

const pinned = (...nodes: { nameWithOwner: string; isArchived: boolean }[]) => ({
  DRIFT_PINNED_JSON: JSON.stringify(nodes),
});

test("the drift check flags a pinned repo that is archived or has no card, without calling gh", async () => {
  const { stdout, ghCalled } = await runDrift(
    1,
    pinned(
      { nameWithOwner: "simonvanlierde/tide", isArchived: true },
      { nameWithOwner: "simonvanlierde/not-on-the-site", isArchived: false },
    ),
  );
  assert.match(stdout, /pinned `simonvanlierde\/tide` is archived/);
  assert.match(stdout, /pinned `simonvanlierde\/not-on-the-site` has no card/);
  assert.doesNotMatch(stdout, /tide` has no card/);
  assert.equal(ghCalled, false);
});

test("the drift check stays quiet for a live pinned repo that has a card", async () => {
  const { stdout } = await runDrift(1, pinned({ nameWithOwner: "simonvanlierde/tide", isArchived: false }));
  assert.equal(stdout, "");
});
