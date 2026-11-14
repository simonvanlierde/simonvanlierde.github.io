import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { test } from "node:test";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = resolve(import.meta.dirname, "../..");
const repo = "https://github.com/example/software";
const metadata = {
  "@context": "https://w3id.org/codemeta/3.0",
  "@type": "SoftwareSourceCode",
  name: "Example software",
  author: [{ "@type": "Person", givenName: "Alex", familyName: "Example" }],
  codeRepository: repo,
  version: "1.0.0",
  datePublished: "2026-01-01",
  license: "https://spdx.org/licenses/MIT",
};
const digest = (body: string) => createHash("sha256").update(body).digest("hex");

async function tree(folder: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) Object.assign(result, await tree(path));
    else result[path] = await readFile(path, "utf8");
  }
  return result;
}

test("pinned tools generate citations and byte-accurate records; failures retain the accepted pair", async () => {
  let body = `${JSON.stringify(metadata, null, 2)}  \n`;
  let status = 200;
  const server = createServer((req, res) => {
    if (req.url?.includes("/missing/")) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(status, { "content-type": "application/json" });
    res.end(body);
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address() as { port: number };
  const folder = await mkdtemp(join(tmpdir(), "metadata-pipeline-"));
  const cards = join(folder, "cards.json");
  await writeFile(
    cards,
    JSON.stringify([
      { id: "example", name: "example.md", card: { repo } },
      { id: "missing", name: "missing.md", card: { repo: "https://github.com/example/missing" } },
    ]),
  );
  const env = {
    ...process.env,
    METADATA_ROOT: folder,
    METADATA_CARDS: cards,
    CODEMETA_BASE_URL: `http://127.0.0.1:${port}`,
  };
  const refresh = () => run("node", ["scripts/fetch-codemeta.mjs"], { cwd: root, env });
  try {
    await refresh();
    const index = JSON.parse(await readFile(join(folder, "src/data/codemeta.json"), "utf8"));
    assert.equal(index["https://github.com/example/missing"], undefined);
    await assert.rejects(readdir(join(folder, "public/citations/missing")));
    assert.match(index[repo].citation.apa, /Example, A\. \(2026\)/);
    assert.match(index[repo].citation.apa, /Example software/);
    const first = JSON.parse(await readFile(join(folder, "src/data/provenance.json"), "utf8"))["codemeta-example"];
    assert.equal(first.sha256, digest(body));
    assert.equal(first.bytes, Buffer.byteLength(body));
    assert.ok(Date.now() - Date.parse(first.retrieved_at) < 60_000);
    assert.equal(first.changed, false);
    assert.equal(await readFile(join(folder, ".cache/sources/codemeta-example", first.sha256), "utf8"), body);
    const canonical = JSON.parse((await readFile(join(folder, "public", first.record), "utf8")).trim());
    assert.equal(canonical.sha256, first.sha256);
    assert.equal(canonical.retrieved_at, first.retrieved_at);
    const downloads = index[repo].citation.downloads;
    const exports: Record<string, string> = {};
    for (const [format, path] of Object.entries(downloads)) {
      assert.match(String(path), /^\/citations\/example\/citation\.[a-z.]+$/);
      exports[format] = await readFile(join(folder, "public", String(path)), "utf8");
    }
    assert.match(exports.bibtex, /@software/);
    assert.equal(JSON.parse(exports.cslJson)[0].type, "software");
    assert.equal(JSON.parse(exports.jsonld)["@context"], "https://schema.org");
    await refresh();
    for (const [format, path] of Object.entries(downloads)) {
      assert.equal(await readFile(join(folder, "public", String(path)), "utf8"), exports[format]);
    }
    body = `${JSON.stringify({ ...metadata, version: "1.1.0" })}\n`;
    await refresh();
    const changed = JSON.parse(await readFile(join(folder, "src/data/provenance.json"), "utf8"))["codemeta-example"];
    assert.equal(changed.changed, true);
    assert.equal(changed.sha256, digest(body));
    body = JSON.stringify({ ...metadata, version: undefined });
    await refresh();
    const optional = JSON.parse(await readFile(join(folder, "src/data/codemeta.json"), "utf8"))[repo];
    assert.equal(optional.version, undefined);
    assert.equal(optional.doi, undefined);
    const accepted = await tree(folder);
    for (const [nextBody, nextStatus] of [
      ["{", 200],
      ["{}", 200],
      ["missing", 404],
      [JSON.stringify({ ...metadata, name: undefined }), 200],
      [JSON.stringify({ ...metadata, author: undefined }), 200],
      [JSON.stringify({ ...metadata, license: undefined }), 200],
    ] as const) {
      body = nextBody;
      status = nextStatus;
      const { stdout } = await refresh();
      assert.match(stdout, /Keeping its last metadata/);
      assert.deepEqual(await tree(folder), accepted);
    }
    status = 200;
    body = JSON.stringify(metadata);
    // Block the real ledger destination; validation and exports pass before record() fails.
    await writeFile(join(folder, "public/provenance/codemeta-example.jsonl"), "not a ledger\n");
    const blocked = await tree(folder);
    assert.match((await refresh()).stdout, /Keeping its last metadata/);
    assert.deepEqual(await tree(folder), blocked);
  } finally {
    server.close();
  }
});

test("failed R9lab totals, series or ledger retain the accepted snapshot and both source records", async () => {
  const series = {
    generated_at: "2026-01-01T00:00:00Z",
    series: [{ period: "2026-01", teardowns: 1, parts: 2, mass_kg: 3, images: 4, users_new: 5 }],
  };
  const totals = { totals: { teardowns: 1, parts: 2, mass_kg: 3, images: 4, users: 5 } };
  let failure = "";
  const server = createServer((req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.url?.includes(failure) && failure) res.end("{}");
    else res.end(JSON.stringify(req.url?.includes("series") ? series : totals));
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address() as { port: number };
  const folder = await mkdtemp(join(tmpdir(), "stats-provenance-"));
  const env = {
    ...process.env,
    METADATA_ROOT: folder,
    STATS_OUT: join(folder, "stats.json"),
    R9LAB_API_URL: `http://127.0.0.1:${port}`,
  };
  const refresh = () => run("node", ["scripts/fetch-stats.mjs"], { cwd: root, env });
  try {
    await refresh();
    const accepted = await tree(folder);
    const records = JSON.parse(await readFile(join(folder, "src/data/provenance.json"), "utf8"));
    assert.equal(records["r9lab-series"].sha256, digest(JSON.stringify(series)));
    assert.equal(records["r9lab-totals"].sha256, digest(JSON.stringify(totals)));
    for (failure of ["series", "totals"]) {
      assert.match((await refresh()).stdout, /::warning::fetch-stats/);
      assert.deepEqual(await tree(folder), accepted);
    }
    failure = "";
    await writeFile(join(folder, "public/provenance/r9lab-totals.jsonl"), "not a ledger\n");
    const blocked = await tree(folder);
    assert.match((await refresh()).stdout, /provenance failed/);
    assert.deepEqual(await tree(folder), blocked);
  } finally {
    server.close();
  }
});

test("unsafe output ids publish no citation files", async () => {
  const folder = await mkdtemp(join(tmpdir(), "metadata-path-"));
  const cards = join(folder, "cards.json");
  const server = createServer((_req, res) => res.end(JSON.stringify(metadata)));
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address() as { port: number };
  try {
    for (const id of ["../outside", "bad/slash", "", "Example"]) {
      await writeFile(cards, JSON.stringify([{ id, name: "example", card: { repo } }]));
      const { stdout } = await run("node", ["scripts/fetch-codemeta.mjs"], {
        cwd: root,
        env: {
          ...process.env,
          METADATA_ROOT: folder,
          METADATA_CARDS: cards,
          CODEMETA_BASE_URL: `http://127.0.0.1:${port}`,
        },
      });
      assert.match(stdout, /Keeping its last metadata/);
      await assert.rejects(readdir(join(folder, "public")));
    }
  } finally {
    server.close();
  }
});

test("the site citation keeps the public CV family name and ORCID", async () => {
  const { personName } = await import("../../src/data/personName.ts");
  assert.deepEqual(personName("Simon van Lierde"), { givenName: "Simon", familyName: "van Lierde" });
  const { parse } = await import("yaml");
  const citation = parse(await readFile(join(root, "CITATION.cff"), "utf8"));
  assert.equal(citation.authors[0]["given-names"], "Simon");
  assert.equal(citation.authors[0]["family-names"], "van Lierde");
  assert.equal(citation.authors[0].orcid, "https://orcid.org/0009-0006-6953-909X");
});

test("a local publication failure restores all accepted files", async () => {
  const folder = await mkdtemp(join(tmpdir(), "metadata-rollback-"));
  await writeFile(join(folder, "accepted.json"), "accepted");
  await writeFile(join(folder, "blocked"), "a file prevents creating a directory");
  const script = `import { publishMetadata } from ${JSON.stringify(join(root, "scripts/metadata.mjs"))};
    await publishMetadata({ "accepted.json": "replacement", "blocked/child.json": "cannot write" });`;
  await assert.rejects(
    run("node", ["--input-type=module", "--eval", script], { env: { ...process.env, METADATA_ROOT: folder } }),
  );
  assert.equal(await readFile(join(folder, "accepted.json"), "utf8"), "accepted");
  assert.equal(await readFile(join(folder, "blocked"), "utf8"), "a file prevents creating a directory");
});

test("overlapping refresh commands refuse the second writer before it changes accepted data", async () => {
  const started = Promise.withResolvers<void>();
  const finish = Promise.withResolvers<void>();
  const server = createServer((_req, res) => {
    started.resolve();
    void finish.promise.then(() => res.end(JSON.stringify(metadata)));
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address() as { port: number };
  const folder = await mkdtemp(join(tmpdir(), "metadata-overlap-"));
  const cards = join(folder, "cards.json");
  await writeFile(cards, JSON.stringify([{ id: "example", name: "example.md", card: { repo } }]));
  const accepted = await tree(folder);
  const env = {
    ...process.env,
    METADATA_ROOT: folder,
    METADATA_CARDS: cards,
    CODEMETA_BASE_URL: `http://127.0.0.1:${port}`,
    R9LAB_API_URL: `http://127.0.0.1:${port}`,
    STATS_OUT: join(folder, "stats.json"),
  };
  const first = run("node", ["scripts/fetch-codemeta.mjs"], { cwd: root, env });
  try {
    await started.promise;
    await assert.rejects(
      run("node", ["scripts/fetch-stats.mjs"], { cwd: root, env }),
      (error: Error & { code?: number; stderr?: string }) => {
        assert.equal(error.code, 3);
        assert.match(error.stderr || "", /another metadata refresh is running/);
        return true;
      },
    );
    assert.deepEqual(await tree(folder), accepted);
  } finally {
    finish.resolve();
    await first;
    server.close();
  }
  await assert.rejects(readdir(join(folder, ".cache/metadata-refresh.lock")));
  const current = JSON.parse(await readFile(join(folder, "src/data/provenance.json"), "utf8"));
  assert.ok(current["codemeta-example"]);
});

test("publication formats generated snapshots before writing and preserves export bytes", async () => {
  const folder = await mkdtemp(join(tmpdir(), "metadata-format-"));
  const source = `${JSON.stringify({ license: ["MIT", "Apache-2.0"] }, null, 2)}\n`;
  const script = `import { acquireMetadataLock, publishMetadata } from ${JSON.stringify(join(root, "scripts/metadata.mjs"))};
    await acquireMetadataLock();
    await publishMetadata(${JSON.stringify({ "src/data/codemeta.json": source, "public/citations/example/citation.jsonld": source, "public/provenance/example.jsonl": source })});`;
  await run("node", ["--input-type=module", "--eval", script], { env: { ...process.env, METADATA_ROOT: folder } });
  assert.match(await readFile(join(folder, "src/data/codemeta.json"), "utf8"), /"license": \["MIT", "Apache-2\.0"\]/);
  assert.equal(await readFile(join(folder, "public/citations/example/citation.jsonld"), "utf8"), source);
  assert.equal(await readFile(join(folder, "public/provenance/example.jsonl"), "utf8"), source);
  const accepted = await tree(folder);
  const invalid = `import { publishMetadata } from ${JSON.stringify(join(root, "scripts/metadata.mjs"))};
    await publishMetadata({ "src/data/codemeta.json": "{}", "src/data/provenance.json": "{" });`;
  await assert.rejects(
    run("node", ["--input-type=module", "--eval", invalid], { env: { ...process.env, METADATA_ROOT: folder } }),
  );
  assert.deepEqual(await tree(folder), accepted);
});
