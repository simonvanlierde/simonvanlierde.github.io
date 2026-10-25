import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { test } from "node:test";
import { promisify } from "node:util";

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

/** Runs the offline drift check on a stats.json that is `days` old; returns stdout and whether gh ran. */
async function drift(days: number) {
  const dir = await mkdtemp(join(tmpdir(), "drift-"));
  const asOf = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  await writeFile(join(dir, "stats.json"), JSON.stringify({ as_of: asOf }));
  // A gh that records its use and fails, so a call cannot pass unnoticed.
  await writeFile(join(dir, "gh"), `#!/bin/sh\necho "$@" >> "${dir}/gh-calls"\nexit 1\n`);
  await chmod(join(dir, "gh"), 0o755);
  const { stdout } = await run("bash", ["scripts/check-drift.sh"], {
    cwd: root,
    env: {
      ...process.env,
      PATH: `${dir}:${process.env.PATH}`,
      DRIFT_OFFLINE: "1",
      DRIFT_STATS_FILE: join(dir, "stats.json"),
    },
  });
  const ghCalled = await readFile(join(dir, "gh-calls")).then(
    () => true,
    () => false,
  );
  return { stdout, asOf, ghCalled };
}

test("the drift check flags a snapshot 22 days old, without calling gh", async () => {
  const { stdout, asOf, ghCalled } = await drift(22);
  assert.match(stdout, new RegExp(`from ${asOf}, 22 days ago`));
  assert.equal(ghCalled, false);
});

test("the drift check stays quiet for a snapshot 20 days old", async () => {
  assert.equal((await drift(20)).stdout, "");
});
