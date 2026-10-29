import { execFile } from "node:child_process";
import { chmod, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = resolve(import.meta.dirname, "../..");

/** A local port nothing listens on. */
export async function closedPort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  const { port } = server.address() as { port: number };
  await new Promise((ok) => server.close(ok));
  return port;
}

/**
 * Runs scripts/check-drift.sh offline with a stats.json fetched `days` ago (null: no fetched_at) and counts dated a year ago and a gh that
 * records its use and fails, so a call cannot pass unnoticed.
 */
export async function runDrift(days: number | null, env: Record<string, string> = {}) {
  const dir = await mkdtemp(join(tmpdir(), "drift-"));
  const asOf = days === null ? undefined : new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  // as_of stays old: only fetched_at may decide the stale flag.
  await writeFile(join(dir, "stats.json"), JSON.stringify({ as_of: "2020-01-01", fetched_at: asOf }));
  await writeFile(join(dir, "gh"), `#!/bin/sh\necho "$@" >> "${dir}/gh-calls"\nexit 1\n`);
  await chmod(join(dir, "gh"), 0o755);
  const { stdout } = await run("bash", ["scripts/check-drift.sh"], {
    cwd: root,
    env: {
      ...process.env,
      PATH: `${dir}:${process.env.PATH}`,
      DRIFT_OFFLINE: "1",
      DRIFT_STATS_FILE: join(dir, "stats.json"),
      ...env,
    },
  });
  const ghCalled = await readFile(join(dir, "gh-calls")).then(
    () => true,
    () => false,
  );
  return { stdout, asOf, ghCalled };
}
