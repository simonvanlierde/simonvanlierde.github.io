import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";
import { latestRecords } from "../../scripts/impact.mjs";
import { projectImpact } from "../../src/data/projectSchema.ts";

const fixture = readFileSync(new URL("../fixtures/impact/impact.jsonl", import.meta.url), "utf8");

test("keeps the latest valid record per kind and warns about each invalid line", () => {
  const warnings: string[] = [];
  const latest = latestRecords(fixture, (problem: string) => warnings.push(problem));
  assert.deepEqual(Object.keys(latest), ["page-view", "ci-job"]);
  assert.equal(latest["page-view"].run.start_time, "2026-11-23T06:00:00Z");
  assert.deepEqual(warnings, [
    "line 2: not JSON",
    "line 4: impact.swd.carbon_operational needs a method with kind, tool and version",
    "line 5: impact.swd.carbon_operational has no uncertainty",
  ]);
});

test("rejects bounds without an interval, reversed bounds and bounds next to unknown", () => {
  const record = (uncertainty: object) =>
    JSON.stringify({
      schema_version: "0",
      run: { name: "x", kind: "page-view", start_time: "2026-11-23T06:00:00Z" },
      measures: {
        co2: { value: 1, unit: "g{CO2-eq}", method: { kind: "modelled", tool: "t", version: "1" }, uncertainty },
      },
    });
  for (const uncertainty of [
    { low: 1, high: 2 },
    { low: 2, high: 1, interval: "min-max" },
    { low: 1, high: 2, interval: "min-max", unknown: true },
    {},
  ])
    assert.deepEqual(latestRecords(record(uncertainty)), {}, JSON.stringify(uncertainty));
});

test("rejects a start_time that is not an RFC 3339 date-time with an offset", () => {
  const record = (start_time: string) =>
    JSON.stringify({
      schema_version: "0",
      run: { name: "x", kind: "page-view", start_time },
      measures: {
        co2: {
          value: 1,
          unit: "g{CO2-eq}",
          method: { kind: "modelled", tool: "t", version: "1" },
          uncertainty: { unknown: true },
        },
      },
    });
  for (const start_time of [
    "2026",
    "Nov 5 2026",
    "2026-11-23",
    "2026-11-23T06:00:00",
    "2026-11-23 06:00:00Z",
    "2026-11-23T06:00Z",
    "2026-02-29T06:00:00Z",
    "2026-02-30T06:00:00Z",
    "2026-11-23T24:00:00Z",
    "2026-11-23T06:00:00+0100",
  ])
    assert.deepEqual(latestRecords(record(start_time)), {}, start_time);
  for (const start_time of ["2028-02-29T06:00:00Z", "2026-11-23t06:00:00.123456+01:00", "2026-11-23T06:00:00-00:00"])
    assert.ok(latestRecords(record(start_time))["page-view"], start_time);
});

test("shows a CO₂e range with its method and date, never a bare point value", () => {
  const records = latestRecords(fixture);
  assert.deepEqual(projectImpact("https://github.com/example/site", records), [
    {
      text: "24–29 mg CO2e per page view, modelled (Sustainable Web Design v4)",
      at: "2026-11-23T06:00:00.000Z",
      atLabel: "Nov 2026",
    },
  ]);
  // The ci-job record has no bounds, so it gives no line.
  assert.deepEqual(projectImpact("https://github.com/example/site", { "ci-job": records["ci-job"] }), []);
  assert.deepEqual(projectImpact("https://github.com/example/no-records"), []);
  // HTML's datetime allows at most three fraction digits, so the instant is written out in UTC.
  const offset = structuredClone(records["page-view"]);
  offset.run.start_time = "2026-12-01T00:30:00.123456+01:00";
  assert.deepEqual(
    projectImpact("https://github.com/example/site", { "page-view": offset }).map(({ at, atLabel }) => [at, atLabel]),
    [["2026-11-30T23:30:00.123Z", "Nov 2026"]],
  );
  // 1,210–1,240 g rounds to "1.2–1.2 kg", a point value in disguise.
  const narrow = structuredClone(records["page-view"]);
  narrow.measures["impact.swd.carbon_operational"].uncertainty = { low: 1210, high: 1240 };
  assert.deepEqual(projectImpact("https://github.com/example/site", { "page-view": narrow }), []);
});

test("refresh writes records, drops a 404 and keeps the last records of a failed fetch", async () => {
  const root = resolve(import.meta.dirname, "../..");
  const dir = await mkdtemp(join(tmpdir(), "impact-refresh-"));
  const repo = (id: string) => `https://github.com/example/${id}`;
  const old = { "page-view": { run: { kind: "page-view" } } };
  try {
    await mkdir(join(dir, "scripts"));
    await mkdir(join(dir, "src/content/projects"), { recursive: true });
    await mkdir(join(dir, "src/data"));
    await symlink(join(root, "node_modules"), join(dir, "node_modules"));
    for (const script of ["impact.mjs", "fetch-impact.mjs", "projectCards.mjs"])
      await cp(join(root, "scripts", script), join(dir, "scripts", script));
    for (const id of ["records", "missing", "unavailable", "new-unavailable", "all-invalid", "stale-invalid"])
      await writeFile(join(dir, `src/content/projects/${id}.md`), `---\nrepo: ${repo(id)}\n---\n`);
    await writeFile(
      join(dir, "src/data/impact.json"),
      JSON.stringify({ [repo("missing")]: old, [repo("unavailable")]: old, [repo("stale-invalid")]: old }),
    );
    await writeFile(join(dir, "records.jsonl"), fixture);
    await writeFile(
      join(dir, "mock.mjs"),
      `import { readFileSync } from "node:fs";
    globalThis.fetch = async (url) => {
      if (!url.endsWith('/impact/impact.jsonl')) throw new Error('unexpected URL ' + url);
      if (url.includes('/example/records/')) return new Response(readFileSync('records.jsonl', 'utf8'));
      if (url.includes('-invalid/')) return new Response('not json\\n');
      if (url.includes('unavailable/')) return new Response('', {status: 503});
      return new Response('', {status: 404});
    };`,
    );
    const { stdout } = await promisify(execFile)("node", ["--import", "./mock.mjs", "scripts/fetch-impact.mjs"], {
      cwd: dir,
    });
    const next = JSON.parse(await readFile(join(dir, "src/data/impact.json"), "utf8"));
    assert.deepEqual(Object.keys(next).sort(), [repo("records"), repo("stale-invalid"), repo("unavailable")], stdout);
    assert.deepEqual(next[repo("records")], latestRecords(fixture));
    assert.equal(next[repo("records")]["page-view"].run.duration_s, undefined, "a field the site does not read");
    assert.deepEqual(next[repo("unavailable")], old);
    assert.deepEqual(next[repo("stale-invalid")], old);
    assert.match(stdout, /::warning::fetch-impact: records\.md: skipped line 2: not JSON/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
