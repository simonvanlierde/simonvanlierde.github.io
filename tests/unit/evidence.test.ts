import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import process from "node:process";
import { test } from "node:test";
import { promisify } from "node:util";
import {
  evidenceDrift,
  parseOpenAlex,
  parseUpstream,
  parseZenodo,
  withAsOf,
  zenodoIds,
} from "../../scripts/evidence.mjs";
import { prGroups } from "../../src/data/upstream.ts";
import { closedPort } from "./driftRun.ts";

const run = promisify(execFile);
const root = resolve(import.meta.dirname, "../..");

// Trimmed copies of real responses.
const node = (repo: string, number: number, base = "main", defaultBranch = "main") => ({
  number,
  title: `PR ${number} `,
  url: `https://github.com/${repo}/pull/${number}`,
  mergedAt: "2026-10-08T08:40:13Z",
  baseRefName: base,
  repository: { nameWithOwner: repo, defaultBranchRef: { name: defaultBranch } },
});
const search = (...nodes: ReturnType<typeof node>[]) => ({
  data: { search: { issueCount: nodes.length, nodes } },
});

test("parseUpstream keeps the facts of each merged PR, sorted by repo and number", () => {
  const prs = parseUpstream(search(node("polca/premise", 317), node("oie/lca_algebraic", 106, "dev")));
  assert.deepEqual(prs, [
    {
      repo: "oie/lca_algebraic",
      number: 106,
      title: "PR 106",
      url: "https://github.com/oie/lca_algebraic/pull/106",
      merged_at: "2026-10-08",
      base: "dev",
      default_branch: "main",
    },
    {
      repo: "polca/premise",
      number: 317,
      title: "PR 317",
      url: "https://github.com/polca/premise/pull/317",
      merged_at: "2026-10-08",
      base: "main",
      default_branch: "main",
    },
  ]);
});

test("parseUpstream refuses an empty, partial or truncated search, so the last good file stays", () => {
  assert.throws(() => parseUpstream(search()), /no pull requests/);
  assert.throws(() => parseUpstream({ data: { search: { issueCount: 101, nodes: [node("a/b", 1)] } } }), /101/);
  assert.throws(() => parseUpstream(search({ ...node("a/b", 1), mergedAt: null } as never)), /missing a field/);
});

test("zenodoIds finds DOI and record links once each", () => {
  const text = `url: https://doi.org/10.5281/zenodo.23460694
  <a href="https://doi.org/10.5281/zenodo.23460694">  url: https://zenodo.org/records/10277791`;
  assert.deepEqual(zenodoIds(text), ["23460694", "10277791"]);
});

test("parseZenodo reads the concept DOI, the latest DOI and the version", () => {
  const record = {
    id: 23693845,
    doi: "10.5281/zenodo.23693845",
    conceptdoi: "10.5281/zenodo.23460694",
    metadata: { version: "0.3.1", publication_date: "2026-10-27" },
  };
  assert.deepEqual(parseZenodo(record), {
    concept_doi: "10.5281/zenodo.23460694",
    latest_doi: "10.5281/zenodo.23693845",
    version: "0.3.1",
    published: "2026-10-27",
  });
  assert.throws(() => parseZenodo({ id: 1, doi: "10.5281/zenodo.1" }), /conceptdoi/);
});

test("parseOpenAlex strips the resolver and lower-cases the DOI", () => {
  const body = {
    results: [
      { doi: "https://doi.org/10.5281/ZENODO.23461825", title: "jsonvet", publication_year: 2026, type: "software" },
      { doi: null, title: "no DOI", publication_year: 2025, type: "article" },
    ],
  };
  assert.deepEqual(parseOpenAlex(body), [
    { doi: "10.5281/zenodo.23461825", title: "jsonvet", year: 2026, type: "software" },
  ]);
  assert.throws(() => parseOpenAlex({ error: "rate limited" }), /no results/);
  assert.throws(() => parseOpenAlex({ results: [] }), /no works/);
  assert.throws(() => parseOpenAlex({ ...body, meta: { count: 201 } }), /201/);
});

test("withAsOf keeps the old date when nothing changed, and moves it when something did", () => {
  const payload = { works: [{ doi: "10.1/a" }] };
  assert.equal(withAsOf({ as_of: "2026-10-01", ...payload }, payload, "2026-10-28").as_of, "2026-10-01");
  assert.equal(withAsOf({ as_of: "2026-10-01", works: [] }, payload, "2026-10-28").as_of, "2026-10-28");
  assert.equal(withAsOf(null, payload, "2026-10-28").as_of, "2026-10-28");
});

test("withAsOf stamps fetched_at on every run, so a dead source shows as stale", () => {
  const payload = { works: [{ doi: "10.1/a" }] };
  const next = withAsOf({ as_of: "2026-10-01", fetched_at: "2026-10-01", ...payload }, payload, "2026-10-28");
  assert.deepEqual(next, { as_of: "2026-10-01", fetched_at: "2026-10-28", ...payload });
});

const facts = (repo: string, number: number, base = "main") => ({
  repo,
  number,
  title: "",
  url: `https://github.com/${repo}/pull/${number}`,
  merged_at: "2026-10-08",
  base,
  default_branch: "main",
});

test("prGroups names the branch of PRs merged outside the default branch", () => {
  const project = { name: "x", repo: "Oie/Lca", what: "", prs: [106, 109, 110] };
  const groups = prGroups(project, [facts("oie/lca", 106, "dev"), facts("oie/lca", 109)]);
  assert.deepEqual(groups, [
    {
      base: undefined,
      prs: [
        { number: 109, url: "https://github.com/oie/lca/pull/109" },
        // Not in the snapshot yet: linked by number, branch unknown.
        { number: 110, url: "https://github.com/Oie/Lca/pull/110" },
      ],
    },
    { base: "dev", prs: [{ number: 106, url: "https://github.com/oie/lca/pull/106" }] },
  ]);
});

test("evidenceDrift flags unlisted merged PRs, listed PRs not merged, old Zenodo versions and unlinked works", () => {
  const report = evidenceDrift({
    curated: [{ name: "x", repo: "a/b", what: "", prs: [1, 2] }],
    leftOut: ["a/list#9"],
    merged: [facts("a/b", 1), facts("a/new", 5), facts("a/list", 9)],
    dois: {
      "100": { concept_doi: "10.5281/zenodo.100", latest_doi: "10.5281/zenodo.103" },
      "101": { concept_doi: "10.5281/zenodo.100", latest_doi: "10.5281/zenodo.103" },
    },
    works: [
      { doi: "10.5281/zenodo.100", title: "linked", year: 2026, type: "software" },
      { doi: "10.1/paper", title: "A paper", year: 2026, type: "article" },
    ],
    siteText: "url: https://doi.org/10.5281/Zenodo.100",
    fetchedAt: {
      "src/data/dois.json": "2026-10-28",
      "src/data/openalex.json": "2026-09-01",
      "src/data/upstream.json": undefined,
    },
    today: "2026-10-29",
  });
  assert.match(report, /merged \[a\/new#5\]/);
  assert.doesNotMatch(report, /a\/list#9|a\/b#1\b/);
  assert.match(report, /listed `a\/b#2` is not among the merged/);
  assert.match(report, /`10\.5281\/zenodo\.101` is an old version/);
  assert.doesNotMatch(report, /zenodo\.100` is an old/);
  assert.match(report, /article \[A paper\]\(https:\/\/doi\.org\/10\.1\/paper\)/);
  assert.doesNotMatch(report, /\[linked\]/);
  assert.match(report, /`src\/data\/openalex\.json` was last fetched on 2026-09-01, 58 days ago/);
  assert.match(report, /`src\/data\/upstream\.json` has no fetched_at date/);
  assert.doesNotMatch(report, /dois\.json/);
});

test("evidenceDrift prints nothing when everything matches", () => {
  const report = evidenceDrift({
    curated: [{ name: "x", repo: "a/b", what: "", prs: [1] }],
    leftOut: [],
    merged: [facts("a/b", 1)],
    dois: { "100": { concept_doi: "10.5281/zenodo.100", latest_doi: "10.5281/zenodo.103" } },
    works: [],
    siteText: "",
    fetchedAt: { "src/data/dois.json": "2026-10-08" },
    today: "2026-10-29",
  });
  assert.equal(report, "");
});

test("a failed refresh warns once per source and leaves every file alone", async () => {
  const files = ["upstream", "dois", "openalex"].map((name) => join(root, `src/data/${name}.json`));
  const before = await Promise.all(files.map((f) => readFile(f, "utf8")));
  // Every request goes through a proxy nothing listens on.
  const proxy = `http://127.0.0.1:${await closedPort()}`;
  const { stdout } = await run("node", ["scripts/fetch-evidence.mjs"], {
    cwd: root,
    env: { ...process.env, GITHUB_TOKEN: "test", NODE_USE_ENV_PROXY: "1", HTTPS_PROXY: proxy, HTTP_PROXY: proxy },
  });
  assert.equal(stdout.match(/^::warning::fetch-evidence: .* failed: /gm)?.length, 3);
  assert.deepEqual(await Promise.all(files.map((f) => readFile(f, "utf8"))), before);
});
