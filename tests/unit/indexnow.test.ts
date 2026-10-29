import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPayload, changedUrls, send } from "../../scripts/indexnow.mjs";

const home = "https://simonvanlierde.com/";
const cv = "https://simonvanlierde.com/cv/";

test("a page-only change posts just that page", () => {
  assert.deepEqual(changedUrls(["src/pages/cv.astro"]), [cv]);
  assert.deepEqual(changedUrls(["src/pages/index.astro", "docs/architecture.md"]), [home]);
});

test("shared code or assets post both pages", () => {
  assert.deepEqual(changedUrls(["src/styles/global.css"]), [home, cv]);
  assert.deepEqual(changedUrls(["pnpm-lock.yaml"]), [home, cv]);
});

test("changes that cannot alter the built pages post nothing", () => {
  assert.deepEqual(
    changedUrls(["README.md", ".github/workflows/deploy.yml", "tests/unit/a.ts", "src/pages/404.astro"]),
    [],
  );
});

test("the payload names the host and the key file", () => {
  const body = buildPayload([home]);
  assert.equal(body.host, "simonvanlierde.com");
  assert.match(body.key, /^[0-9a-f]{8,128}$/);
  assert.equal(body.keyLocation, `https://simonvanlierde.com/${body.key}.txt`);
  assert.deepEqual(body.urlList, [home]);
});

test("send posts JSON and reports a failure as a message", async () => {
  let seen: { url: string; body: string } | undefined;
  const ok = await send(buildPayload([home]), (url: string, init: { body: string }) => {
    seen = { url, body: init.body };
    return Promise.resolve({ ok: true, status: 200 });
  });
  assert.equal(ok, "");
  assert.equal(seen?.url, "https://api.indexnow.org/indexnow");
  assert.deepEqual(JSON.parse(seen?.body ?? "").urlList, [home]);
  assert.match(await send({}, () => Promise.resolve({ ok: false, status: 429 })), /429/);
  assert.match(await send({}, () => Promise.reject(new Error("down"))), /down/);
});
