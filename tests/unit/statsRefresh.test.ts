import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { copyFile, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { test } from "node:test";
import { promisify } from "node:util";
import { closedPort, runDrift } from "./driftRun.ts";

const run = promisify(execFile);
const root = resolve(import.meta.dirname, "../..");

test("a failed refresh warns and leaves the snapshot alone", async () => {
  // A copy, so a broken failure path cannot overwrite the tracked snapshot.
  const file = join(await mkdtemp(join(tmpdir(), "stats-")), "stats.json");
  await copyFile(join(root, "src/data/stats.json"), file);
  const before = await readFile(file, "utf8");
  const { stdout } = await run("node", ["scripts/fetch-stats.mjs"], {
    cwd: root,
    env: { ...process.env, R9LAB_API_URL: `http://127.0.0.1:${await closedPort()}`, STATS_OUT: file },
  });
  assert.match(stdout, /^::warning::fetch-stats:/m);
  assert.equal(await readFile(file, "utf8"), before);
});

// Each body is what one endpoint answers; the run must warn, exit 0 and write nothing.
for (const [name, series, totals] of [
  ["a body that is not JSON", "<html>", "<html>"],
  [
    "a period that is not YYYY-MM",
    JSON.stringify({
      generated_at: "2026-10-28T06:00:00Z",
      series: [{ period: "2026-1", teardowns: 1, parts: 2, mass_kg: 3, images: 4, users_new: 5 }],
    }),
    JSON.stringify({ totals: { teardowns: 1, parts: 2, mass_kg: 3, images: 4, users: 5 } }),
  ],
  [
    "a series without generated_at",
    JSON.stringify({ series: [{ period: "2026-01", teardowns: 1, parts: 2, mass_kg: 3, images: 4, users_new: 5 }] }),
    JSON.stringify({ totals: { teardowns: 1, parts: 2, mass_kg: 3, images: 4, users: 5 } }),
  ],
]) {
  test(`a refresh given ${name} warns and writes nothing`, async () => {
    const server = createHttpServer((req, res) => {
      res.setHeader("content-type", "application/json");
      res.end(req.url?.includes("series") ? series : totals);
    });
    await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
    const { port } = server.address() as { port: number };
    const file = join(await mkdtemp(join(tmpdir(), "stats-")), "stats.json");
    try {
      const { stdout } = await run("node", ["scripts/fetch-stats.mjs"], {
        cwd: root,
        env: { ...process.env, R9LAB_API_URL: `http://127.0.0.1:${port}`, STATS_OUT: file },
      });
      assert.match(stdout, /^::warning::fetch-stats:/m);
      await assert.rejects(readFile(file, "utf8"));
    } finally {
      server.close();
    }
  });
}

test("the drift check flags a snapshot 22 days old, without calling gh", async () => {
  const { stdout, asOf, ghCalled } = await runDrift(22);
  assert.match(stdout, new RegExp(`from ${asOf}, 22 days ago`));
  assert.equal(ghCalled, false);
});

test("the drift check stays quiet for a snapshot 20 days old", async () => {
  assert.equal((await runDrift(20)).stdout, "");
});

test("the drift check flags a snapshot with no fetched_at date", async () => {
  assert.match((await runDrift(null)).stdout, /has no fetched_at date/);
});

test("the drift check stays quiet when the counts are old but the fetch is fresh", async () => {
  assert.equal((await runDrift(0)).stdout, "");
});

test("a refresh with unchanged counts keeps as_of and stamps fetched_at", async () => {
  const series = [{ period: "2026-01", teardowns: 1, parts: 2, mass_kg: 3, images: 4, users_new: 5 }];
  const totals = { teardowns: 1, parts: 2, mass_kg: 3, images: 4, users: 5 };
  const server = createHttpServer((req, res) => {
    res.setHeader("content-type", "application/json");
    const body = req.url?.includes("series") ? { series, generated_at: "2026-10-28T06:00:00Z" } : { totals };
    res.end(JSON.stringify(body));
  });
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  const { port } = server.address() as { port: number };
  const dir = await mkdtemp(join(tmpdir(), "stats-"));
  const file = join(dir, "stats.json");
  const env = { ...process.env, R9LAB_API_URL: `http://127.0.0.1:${port}`, STATS_OUT: file };
  try {
    await run("node", ["scripts/fetch-stats.mjs"], { cwd: root, env });
    const first = JSON.parse(await readFile(file, "utf8"));
    await writeFile(file, JSON.stringify({ ...first, as_of: "2026-01-05", fetched_at: "2026-01-05" }));
    await run("node", ["scripts/fetch-stats.mjs"], { cwd: root, env });
    const second = JSON.parse(await readFile(file, "utf8"));
    assert.equal(second.as_of, "2026-01-05");
    assert.equal(second.fetched_at, new Date().toISOString().slice(0, 10));
  } finally {
    server.close();
  }
});
