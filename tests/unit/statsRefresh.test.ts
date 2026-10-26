import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import process from "node:process";
import { test } from "node:test";
import { promisify } from "node:util";
import { runDrift } from "./driftRun.ts";

const run = promisify(execFile);
const root = resolve(import.meta.dirname, "../..");

/** A local port nothing listens on. */
async function closedPort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  const { port } = server.address() as { port: number };
  await new Promise((ok) => server.close(ok));
  return port;
}

test("a failed refresh warns and leaves the snapshot alone", async () => {
  const file = join(root, "src/data/stats.json");
  const before = await readFile(file, "utf8");
  const { stdout } = await run("node", ["scripts/fetch-stats.mjs"], {
    cwd: root,
    env: { ...process.env, R9LAB_API_URL: `http://127.0.0.1:${await closedPort()}` },
  });
  assert.match(stdout, /^::warning::fetch-stats:/m);
  assert.equal(await readFile(file, "utf8"), before);
});

test("the drift check flags a snapshot 22 days old, without calling gh", async () => {
  const { stdout, asOf, ghCalled } = await runDrift(22);
  assert.match(stdout, new RegExp(`from ${asOf}, 22 days ago`));
  assert.equal(ghCalled, false);
});

test("the drift check stays quiet for a snapshot 20 days old", async () => {
  assert.equal((await runDrift(20)).stdout, "");
});

test("the drift check flags a snapshot with no as_of date", async () => {
  assert.match((await runDrift(null)).stdout, /has no as_of date/);
});
