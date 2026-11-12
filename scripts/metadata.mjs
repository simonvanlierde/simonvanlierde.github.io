import { execFile, spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { promisify } from "node:util";

const exec = promisify(execFile);
export const metadataRoot = resolve(process.env.METADATA_ROOT || resolve(import.meta.dirname, ".."));

/** Serialise refresh commands before reading snapshots or writing their shared index. */
export async function acquireMetadataLock() {
  const lock = resolve(metadataRoot, ".cache/metadata-refresh.lock");
  await mkdir(dirname(lock), { recursive: true });
  try {
    await mkdir(lock);
  } catch (error) {
    if (error.code === "EEXIST") {
      console.error("error: another metadata refresh is running; retry after it finishes");
      process.exit(3);
    }
    throw error;
  }
  const release = () => rmSync(lock, { recursive: true, force: true });
  process.once("exit", release);
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => {
      release();
      process.kill(process.pid, signal);
    });
}

export const readJson = (path, fallback = {}) => readFile(path, "utf8").then(JSON.parse, () => fallback);

/** Capture the HTTP body before parsing: the ledger identifies the received bytes. */
export async function capture(response, id, url) {
  const body = Buffer.from(await response.arrayBuffer());
  return { id, url, retrievedAt: new Date().toISOString(), body: body.toString("base64"), parsed: JSON.parse(body) };
}

/** Run the released public tools in the locked local environment; publish nothing on failure. */
export async function generateMetadata(request) {
  const temp = await mkdtemp(resolve(tmpdir(), "site-metadata-"));
  try {
    const input = resolve(temp, "request.json");
    await writeFile(input, JSON.stringify({ ...request, root: metadataRoot }));
    const { stdout, stderr } = await exec(
      "uv",
      ["run", "--locked", "--script", resolve(import.meta.dirname, "metadata.py"), input],
      {
        maxBuffer: 16 * 1024 * 1024,
        timeout: 180_000,
      },
    );
    if (stderr) process.stderr.write(stderr);
    return JSON.parse(stdout);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

/** A failed local write restores all accepted snapshots and their provenance together. */
export async function publishMetadata(files, raw = {}) {
  const formatted = { ...files };
  for (const [path, content] of Object.entries(files)) {
    if (!/^src\/data\/(?:codemeta|stats|provenance)\.json$/.test(path)) continue;
    const result = spawnSync(
      resolve(import.meta.dirname, "../node_modules/.bin/biome"),
      ["format", `--stdin-file-path=${path}`],
      {
        input: content,
        encoding: "utf8",
        cwd: resolve(import.meta.dirname, ".."),
        timeout: 30_000,
        maxBuffer: 16 * 1024 * 1024,
      },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`cannot format metadata snapshot: ${result.stderr}`);
    formatted[path] = result.stdout;
  }
  const previous = new Map();
  try {
    for (const [path, content] of Object.entries({ ...formatted, ...raw })) {
      const absolute = resolve(metadataRoot, path);
      if (!absolute.startsWith(`${metadataRoot}/`)) throw new Error("metadata output escapes repository");
      previous.set(
        absolute,
        await readFile(absolute).catch((error) => {
          if (error.code !== "ENOENT") throw error;
          return null;
        }),
      );
      await mkdir(dirname(absolute), { recursive: true });
      await writeFile(absolute, Object.hasOwn(raw, path) ? Buffer.from(content, "base64") : content);
    }
  } catch (error) {
    for (const [path, content] of previous) {
      if (content === null) await rm(path, { force: true });
      else await writeFile(path, content);
    }
    throw error;
  }
}
