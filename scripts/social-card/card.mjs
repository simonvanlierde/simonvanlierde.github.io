// Renders a 1200x630 title-block social card. See README in the usage text below.
// Chromium runs in a pinned Playwright container so no fonts or browsers are installed on the host.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import sharp from "sharp";

// Keep in step with the @playwright/test version in package.json.
export const IMAGE = "mcr.microsoft.com/playwright:v1.64.1-noble";
export const MAX_BYTES = 200 * 1024;
const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");

const USAGE = `Usage: pnpm gen:card --visual <png|jpg> --name <text> --line <text> --year <yyyy> --domain <host> --out <png> [--doi <doi>] [--fit contain|cover]`;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function parse(argv) {
  const { values: v } = parseArgs({
    args: argv,
    options: Object.fromEntries(
      ["visual", "name", "line", "year", "domain", "out", "doi", "fit"].map((k) => [k, { type: "string" }]),
    ),
  });
  for (const k of ["visual", "name", "line", "year", "domain", "out"]) {
    if (!v[k]) throw new Error(`missing --${k}\n${USAGE}`);
  }
  if (!/^\d{4}$/.test(v.year)) throw new Error(`--year must be four digits, got ${v.year}`);
  if (v.fit && !["contain", "cover"].includes(v.fit)) throw new Error("--fit must be contain or cover");
  if (!existsSync(v.visual)) throw new Error(`visual not found: ${v.visual}`);
  return v;
}

export async function render(v) {
  const dir = mkdtempSync(join(tmpdir(), "card-"));
  try {
    const doi = v.doi
      ? `<div class="row"><div class="cell"><div class="label">DOI</div><div class="value">${esc(v.doi)}</div></div></div>`
      : "";
    const html = readFileSync(join(here, "template.html"), "utf8")
      .replace("{{name}}", () => esc(v.name))
      .replace("{{line}}", () => esc(v.line))
      .replace("{{year}}", () => esc(v.year))
      .replace("{{domain}}", () => esc(v.domain))
      .replace("{{doi}}", () => doi)
      .replace("{{fitclass}}", v.fit === "cover" ? "cover" : "");
    writeFileSync(join(dir, "card.html"), html);
    copyFileSync(join(repo, "public/fonts/osifont.woff2"), join(dir, "osifont.woff2"));
    await sharp(v.visual).png().toFile(join(dir, "visual.png"));
    execFileSync(
      "docker",
      [
        "run",
        "--rm",
        "--user",
        `${process.getuid()}:${process.getgid()}`,
        "-v",
        `${dir}:/card`,
        "-v",
        `${repo}:/repo:ro`,
        "-w",
        "/repo",
        IMAGE,
        "node",
        "scripts/social-card/shot.mjs",
      ],
      { stdio: "inherit" },
    );
    // Palette PNG keeps the flat drawing look and lands well under the size cap.
    let buf;
    for (const colours of [256, 128, 64]) {
      buf = await sharp(join(dir, "raw.png")).png({ palette: true, colours, effort: 10 }).toBuffer();
      if (buf.length <= MAX_BYTES) break;
    }
    if (buf.length > MAX_BYTES) throw new Error(`card is ${buf.length} bytes, over ${MAX_BYTES}`);
    writeFileSync(v.out, buf);
    return v.out;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const out = await render(parse(process.argv.slice(2)));
    console.log(`Wrote ${out} (${statSync(out).size} bytes)`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
