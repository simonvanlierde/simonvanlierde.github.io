import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { test } from "node:test";
import { promisify } from "node:util";
import { parseCodemeta } from "../../scripts/codemeta.mjs";
import { projectMetadata, projectNodes } from "../../src/data/projectSchema.ts";

for (const key of ["type", "@type"]) {
  for (const type of ["Role", "https://schema.org/Role", "http://schema.org/Role", ["Role", "Thing"]]) {
    test(`keeps people separate from ${key}=${JSON.stringify(type)} attribution records`, () => {
      const person = { type: "Person", id: "#author-1", name: "Alex Example" };
      const role = {
        [key]: type,
        "schema:author": person.id,
        roleName: "https://credit.niso.org/contributor-roles/software/",
      };
      const raw = { name: "Example software", author: [person, role] };
      const original = structuredClone(raw);
      assert.deepEqual(parseCodemeta(raw), { name: "Example software", author: [{ name: "Alex Example" }] });
      assert.deepEqual(raw, original);
      assert.throws(() => parseCodemeta({ author: [role] }), /author must not be empty/);
      assert.throws(() => parseCodemeta({ author: [role, {}] }), /author must have a name/);
    });
  }
}

// Metadata fields from each repository's /HEAD/codemeta.json on raw.githubusercontent.com, fetched 2026-11-07.
const expected = {
  "brightway-benchmarks": { license: "https://spdx.org/licenses/BSD-3-Clause" },
  "codemeta-drift": { doi: "https://doi.org/10.5281/zenodo.23774728", license: "https://spdx.org/licenses/Apache-2.0" },
  "credit-matrix": {
    version: "0.11.0",
    doi: "https://doi.org/10.5281/zenodo.21213659",
    license: "https://spdx.org/licenses/MIT",
  },
  "ramascene-explorer": {
    version: "0.6.0",
    doi: "https://doi.org/10.5281/zenodo.23461260",
    license: "https://spdx.org/licenses/MIT",
  },
  sourceledger: {
    version: "0.4.0",
    doi: "https://doi.org/10.5281/zenodo.23460694",
    license: "https://spdx.org/licenses/MIT",
  },
};
for (const [id, result] of Object.entries(expected)) {
  test(`parses ${id}'s published metadata fields`, () => {
    const raw = JSON.parse(readFileSync(new URL(`../fixtures/codemeta/${id}.json`, import.meta.url), "utf8"));
    assert.deepEqual(parseCodemeta(raw), result);
  });
}

test("CodeMeta 2.0 list contexts and PropertyValue identifiers need no context fetching", () => {
  const raw = JSON.parse(
    readFileSync(new URL("../fixtures/codemeta/2.0-property-value.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(parseCodemeta(raw), {
    version: "1.2.3-rc.1",
    doi: "https://doi.org/10.5281/zenodo.123",
    license: ["https://spdx.org/licenses/MIT", "https://spdx.org/licenses/Apache-2.0"],
  });
});

test("project nodes use committed metadata without changing handwritten titles and tags", () => {
  const repo = "https://github.com/simonvanlierde/credit-matrix";
  const data = { title: "Handwritten title", description: "A tool", repo, tags: ["Python", "Research"], links: [] };
  const [node] = projectNodes([{ id: "credit-matrix", data }]);
  assert.ok("codeRepository" in node);
  assert.equal(node.name, data.title);
  assert.equal(node.version, projectMetadata(repo)?.version);
  assert.equal(node.identifier, "https://doi.org/10.5281/zenodo.21213659");
  assert.equal(node.license, "https://spdx.org/licenses/MIT");
  assert.deepEqual(node.programmingLanguage, ["Python"]);
  assert.deepEqual(node.keywords, ["Research"]);
});

test("refresh updates successes and keeps each failed repository's last good metadata", async () => {
  const root = resolve(import.meta.dirname, "../..");
  const dir = await mkdtemp(join(tmpdir(), "codemeta-refresh-"));
  const repo = (id: string) => `https://github.com/example/${id}`;
  const old = { version: "1.0.0", doi: "https://doi.org/10.5281/zenodo.123", fetched_at: "2026-01-01" };
  try {
    await mkdir(join(dir, "scripts"));
    await mkdir(join(dir, "src/content/projects"), { recursive: true });
    await mkdir(join(dir, "src/data"));
    await symlink(join(root, "node_modules"), join(dir, "node_modules"));
    for (const script of [
      "codemeta.mjs",
      "fetch-codemeta.mjs",
      "projectCards.mjs",
      "metadata.mjs",
      "metadata.py",
      "metadata.py.lock",
    ])
      await cp(join(root, "scripts", script), join(dir, "scripts", script));
    for (const id of ["success", "malformed", "invalid-doi", "unavailable", "missing", "new"]) {
      await writeFile(join(dir, `src/content/projects/${id}.md`), `---\nrepo: ${repo(id)}\n---\n`);
    }
    await writeFile(
      join(dir, "src/data/codemeta.json"),
      JSON.stringify(
        Object.fromEntries(
          ["success", "malformed", "invalid-doi", "unavailable", "missing", "removed"].map((id) => [repo(id), old]),
        ),
      ),
    );
    await writeFile(
      join(dir, "mock.mjs"),
      `let started = 0;
    const ready = Promise.withResolvers();
    const deadline = setTimeout(() => { throw new Error('metadata requests did not overlap'); }, 5000);
    globalThis.fetch = async (url) => {
      if (++started === 6) { clearTimeout(deadline); ready.resolve(); }
      await ready.promise;
      if (url.includes('/success/')) return Response.json({'@context': 'https://w3id.org/codemeta/3.0', '@type': 'SoftwareSourceCode', name: 'Example', author: {name: 'Alex River'}, datePublished: '2026-11-12', version: '2.0.0'});
      if (url.includes('/malformed/')) return Response.json({license: 'javascript:alert(1)'});
      if (url.includes('/invalid-doi/')) return Response.json({version: '2.0.0', identifier: 'doi:not-a-doi'});
      if (url.includes('/unavailable/')) return new Response('', {status: 503});
      return new Response('', {status: 404});
    };`,
    );
    const { stdout } = await promisify(execFile)("node", ["--import", "./mock.mjs", "scripts/fetch-codemeta.mjs"], {
      cwd: dir,
    });
    const next = JSON.parse(await readFile(join(dir, "src/data/codemeta.json"), "utf8"));
    const { citation, sourceId, ...success } = next[repo("success")];
    assert.equal(sourceId, "codemeta-success", stdout);
    assert.match(citation.apa, /Alex River/);
    assert.deepEqual(success, {
      name: "Example",
      author: [{ name: "Alex River" }],
      datePublished: "2026-11-12",
      version: "2.0.0",
      fetched_at: new Date().toISOString().slice(0, 10),
    });
    for (const id of ["malformed", "invalid-doi", "unavailable", "missing"]) assert.deepEqual(next[repo(id)], old);
    assert.equal(next[repo("new")], undefined);
    assert.equal(next[repo("removed")], undefined);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("rejects malformed metadata instead of replacing a last good entry", () => {
  for (const raw of [
    null,
    [],
    {},
    { license: "javascript:alert(1)" },
    { version: {} },
    { version: "<script>" },
    { identifier: "https://doi.org/not-a-doi" },
    { identifier: "doi:not-a-doi", version: "2.0.0" },
    { identifier: "https://doi.org/10.1234/.." },
    { identifier: "https://doi.org/10.1234/a/%2e./b" },
    { identifier: "10.1234/a\\b" },
    { license: "https://user:pass@example.org/license" },
  ]) {
    assert.throws(() => parseCodemeta(raw));
  }
  assert.deepEqual(
    parseCodemeta({ identifier: "https://example.org/project", license: "https://spdx.org/licenses/MIT" }),
    { license: "https://spdx.org/licenses/MIT" },
  );
});

test("Astro rejects a manual DOI supplied by CodeMeta but accepts a different DOI", async () => {
  const root = resolve(import.meta.dirname, "../..");
  const dir = await mkdtemp(join(tmpdir(), "codemeta-schema-"));
  try {
    await mkdir(join(dir, "src/data"), { recursive: true });
    await mkdir(join(dir, "src/content/projects"), { recursive: true });
    await mkdir(join(dir, "src/pages"));
    await symlink(join(root, "node_modules"), join(dir, "node_modules"));
    await writeFile(join(dir, "package.json"), '{"type":"module"}');
    for (const path of ["src/content.config.ts", "src/data/projectSchema.ts", "src/data/codemeta.json"])
      await cp(join(root, path), join(dir, path));
    await writeFile(
      join(dir, "src/pages/index.astro"),
      '---\nimport { getCollection } from "astro:content";\nconst cards = await getCollection("projects");\n---\n<p>{cards.length}</p>',
    );
    const cardPath = join(dir, "src/content/projects/example.md");
    const card = (doi: string) =>
      `---\ntitle: Example\ndescription: Example\nkind: Tool\nrepo: https://github.com/simonvanlierde/credit-matrix\nlinks:\n  - label: Paper\n    url: ${doi}\n---\n`;
    const build = () =>
      promisify(execFile)(process.execPath, [join(root, "node_modules/astro/bin/astro.mjs"), "build", "--root", dir], {
        cwd: dir,
      });
    await writeFile(cardPath, card("https://dx.doi.org/10.5281/zenodo.21213659/"));
    await assert.rejects(build, (error: Error & { stdout: string; stderr: string }) =>
      /DOI is supplied by CodeMeta; remove the duplicate card link/.test(error.stdout + error.stderr),
    );
    await writeFile(cardPath, card("https://doi.org/10.5281/zenodo.123"));
    await build();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// CodeMeta citation lists related works; the software's own citation uses its bibliographic fields.
test("caches public bibliographic fields without treating related works as the software citation", () => {
  assert.deepEqual(
    parseCodemeta({
      name: "Example software",
      author: [
        { givenName: "Alex", familyName: "River", email: "alex@example.org" },
        { name: "Example research team" },
      ],
      datePublished: "2026-11-12",
      citation: { name: "A related paper", url: "https://example.org/paper" },
    }),
    {
      name: "Example software",
      author: [{ givenName: "Alex", familyName: "River" }, { name: "Example research team" }],
      datePublished: "2026-11-12",
    },
  );
  assert.deepEqual(parseCodemeta({ name: "Example", author: { name: "Alex River" } }), {
    name: "Example",
    author: [{ name: "Alex River" }],
  });
  assert.equal(
    parseCodemeta({ datePublished: "2026-11-12T12:00:00+01:00" }).datePublished,
    "2026-11-12T12:00:00+01:00",
  );
  assert.throws(() => parseCodemeta({ citation: { name: "A related paper" } }));
});

test("rejects malformed bibliographic fields rather than overwriting the cache", () => {
  for (const field of [
    { name: {} },
    { name: " " },
    { author: "Alex River" },
    { author: [{}] },
    { author: [{ name: 42 }] },
    { author: [] },
    { datePublished: "yesterday" },
    { datePublished: "2026-02-30" },
  ])
    assert.throws(() => parseCodemeta({ version: "1.0.0", ...field }));
});

test("keeps the thesis dataset licence and DOI separate from the software licence", () => {
  const nodes = projectNodes([
    {
      id: "msc-thesis-ie",
      data: {
        title: "Example thesis",
        description: "Example model",
        repo: "https://github.com/simonvanlierde/msc-thesis-ie",
        tags: [],
        links: [
          {
            label: "Zenodo dataset",
            url: "https://doi.org/10.5281/zenodo.8344580",
            license: "https://spdx.org/licenses/CC-BY-4.0.html",
          },
        ],
      },
    },
  ]);
  assert.equal(nodes[0].license, "https://spdx.org/licenses/GPL-3.0-or-later");
  assert.equal(nodes[1].license, "https://spdx.org/licenses/CC-BY-4.0.html");
  assert.equal(nodes[1].url, "https://doi.org/10.5281/zenodo.8344580");
  assert.notEqual("identifier" in nodes[0] ? nodes[0].identifier : undefined, nodes[1].url);
});

test("CodeMeta accepts year and month precision without inventing a release day", () => {
  for (const date of ["2026", "2026-11", "2024-02-29", "2026-11-12T23:00:00-01:00"]) {
    assert.equal(parseCodemeta({ datePublished: date }).datePublished, date);
  }
  for (const date of ["2026-00", "2026-13", "2026-1", "2026-02-30", "2025-02-29"]) {
    assert.throws(() => parseCodemeta({ datePublished: date }));
  }
});
