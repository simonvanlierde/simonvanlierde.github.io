import assert from "node:assert/strict";
import { mkdtempSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { test } from "node:test";
import sharp from "sharp";
import { MAX_BYTES, parse, render } from "../../scripts/social-card/card.mjs";

const ok: Record<string, string> = {
  visual: "public/og.png",
  name: "demo",
  line: "One line.",
  domain: "demo.example.org",
  out: "x.png",
};
const argv = (o: Record<string, string>) => Object.entries(o).flatMap(([k, v]) => [`--${k}`, v]);

test("rejects each missing required input", () => {
  for (const k of Object.keys(ok)) {
    const { [k]: _, ...rest } = ok;
    assert.throws(() => parse(argv(rest)), new RegExp(`missing --${k}`));
  }
});

test("rejects a missing visual", () => {
  assert.throws(() => parse(argv({ ...ok, visual: "nope.png" })), /not found/);
});

// Pulls a 2 GB image, so it runs only when asked: CARD_RENDER=1 pnpm test, and in social-card.yml.
test("renders a 1200x630 PNG under the size cap", { skip: !process.env.CARD_RENDER }, async () => {
  const out = join(mkdtempSync(join(tmpdir(), "card-test-")), "card.png");
  await render({ ...ok, out });
  const meta = await sharp(out).metadata();
  assert.deepEqual([meta.width, meta.height], [1200, 630]);
  assert.ok(statSync(out).size <= MAX_BYTES);
});
