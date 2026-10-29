import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import process from "node:process";
import { test } from "node:test";
import { promisify } from "node:util";
import { evidenceDrift, parseUpstream } from "../../scripts/evidence.mjs";
import { prGroups } from "../../src/data/upstream.ts";
import { closedPort } from "./driftRun.ts";

const run = promisify(execFile);
const root = resolve(import.meta.dirname, "../..");

const node = (repo: string, number: number) => ({
  number,
  baseRefName: "main",
  repository: { nameWithOwner: repo, defaultBranchRef: { name: "main" } },
});

test("parseUpstream refuses an empty, partial or truncated search, so the last good file stays", () => {
  assert.throws(() => parseUpstream({ data: { search: { issueCount: 0, nodes: [] } } }), /no pull requests/);
  assert.throws(() => parseUpstream({ data: { search: { issueCount: 101, nodes: [node("a/b", 1)] } } }), /101/);
  const partial = { ...node("a/b", 1), baseRefName: null };
  assert.throws(() => parseUpstream({ data: { search: { issueCount: 1, nodes: [partial] } } }), /missing a field/);
});

const pr = (repo: string, number: number, base = "main") => ({ repo, number, base, default_branch: "main" });

test("prGroups names the branch of PRs merged outside the default branch", () => {
  const project = { name: "x", repo: "Oie/Lca", what: "", prs: [106, 109, 110] };
  // 110 is not in the snapshot yet, so it counts as the default branch.
  assert.deepEqual(prGroups(project, [pr("oie/lca", 106, "dev"), pr("oie/lca", 109)]), [
    { base: undefined, prs: [109, 110] },
    { base: "dev", prs: [106] },
  ]);
});

test("evidenceDrift flags unlisted merged PRs, listed PRs not merged and a stale snapshot", () => {
  const report = evidenceDrift({
    curated: [{ name: "x", repo: "a/b", what: "", prs: [1, 2] }],
    leftOut: ["a/list#9"],
    merged: [pr("a/b", 1), pr("a/new", 5), pr("a/list", 9)],
    fetchedAt: "2026-09-01",
    today: "2026-10-29",
  });
  assert.match(report, /merged \[a\/new#5\]\(https:\/\/github\.com\/a\/new\/pull\/5\)/);
  assert.doesNotMatch(report, /a\/list#9|a\/b#1\b/);
  assert.match(report, /listed `a\/b#2` is not among the merged/);
  assert.match(report, /was last fetched on 2026-09-01, 58 days ago/);
  assert.match(
    evidenceDrift({ curated: [], leftOut: [], merged: [], fetchedAt: undefined, today: "2026-10-29" }),
    /no fetched_at date/,
  );
});

test("evidenceDrift prints nothing when everything matches", () => {
  const curated = [{ name: "x", repo: "a/b", what: "", prs: [1] }];
  const args = { curated, leftOut: [], merged: [pr("a/b", 1)], fetchedAt: "2026-10-08", today: "2026-10-29" };
  assert.equal(evidenceDrift(args), "");
});

test("a failed refresh warns and leaves upstream.json alone", async () => {
  const file = join(root, "src/data/upstream.json");
  const before = await readFile(file, "utf8");
  // Every request goes through a proxy nothing listens on.
  const proxy = `http://127.0.0.1:${await closedPort()}`;
  const { stdout } = await run("node", ["scripts/fetch-evidence.mjs"], {
    cwd: root,
    env: { ...process.env, GITHUB_TOKEN: "test", NODE_USE_ENV_PROXY: "1", HTTPS_PROXY: proxy, HTTP_PROXY: proxy },
  });
  assert.match(stdout, /^::warning::fetch-evidence: POST .* failed: /m);
  assert.equal(await readFile(file, "utf8"), before);
});
