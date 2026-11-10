import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { test } from "node:test";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = resolve(import.meta.dirname, "../..");

/**
 * Runs scripts/check-drift.sh online against a fake gh that reports every linked repo as live, except
 * tide: `repoError` is what gh prints for it, with exit 1.
 */
async function runOnline(repoError: string) {
  const dir = await mkdtemp(join(tmpdir(), "drift-online-"));
  await writeFile(
    join(dir, "gh"),
    `#!/bin/sh
case "$*" in
  *"commits?path="*) echo 2026-01-01T00:00:00Z ;;
  *"/readme"*) echo "See the site." ;;
  "repo list"*) echo tide ;;
  *"/commits?per_page"*) echo 2025-01-01T00:00:00Z ;;
  "api repos/simonvanlierde/tide --jq"*) [ -n "${repoError}" ] && { echo "${repoError}" >&2; exit 1; }; echo "tide false" ;;
  "api repos/simonvanlierde/"*" --jq"*) echo "\${2#repos/simonvanlierde/} false" ;;
  "api graphql"*) echo "[]" ;;
  *) exit 1 ;;
esac
`,
  );
  await chmod(join(dir, "gh"), 0o755);
  return run("bash", ["scripts/check-drift.sh"], {
    cwd: root,
    env: { ...process.env, PATH: `${dir}:${process.env.PATH}` },
  });
}

test("a repo gh reports as not found is listed as gone", async () => {
  const { stdout } = await runOnline("gh: Not Found (HTTP 404)");
  assert.match(stdout, /`tide` is linked but the repo does not exist/);
});

test("any other gh failure stops the run instead of reading as a result", async () => {
  await assert.rejects(runOnline("gh: Server Error (HTTP 502)"), (err: { code?: number }) => err.code === 1);
});
