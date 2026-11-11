// Renders a 1200x630 poster social card: name, one line, address and one app visual; USAGE below lists the flags.
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

const USAGE = `Usage: pnpm gen:card (--visual <png|jpg> and/or --mark <png|svg>) --name <text> --line <text> --domain <host> --out <png> [--fit cover|contain] [--focus <css object-position>]\n--mark is the app icon, above the name inside the centre 630 px; --visual is a real proof (a figure, a dial) in the right panel. Give one or both.`;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function parse(argv) {
  const { values: v } = parseArgs({
    args: argv,
    options: Object.fromEntries(
      ["visual", "mark", "name", "line", "domain", "out", "fit", "focus"].map((k) => [k, { type: "string" }]),
    ),
  });
  for (const k of ["name", "line", "domain", "out"]) {
    if (!v[k]) throw new Error(`missing --${k}\n${USAGE}`);
  }
  if (!v.visual && !v.mark) throw new Error(`missing --visual or --mark\n${USAGE}`);
  if (v.fit && !["contain", "cover"].includes(v.fit)) throw new Error("--fit must be contain or cover");
  for (const k of ["visual", "mark"]) {
    if (v[k] && !existsSync(v[k])) throw new Error(`${k} not found: ${v[k]}`);
  }
  return v;
}

export async function render(v) {
  const dir = mkdtempSync(join(tmpdir(), "card-"));
  try {
    const html = readFileSync(join(here, "template.html"), "utf8")
      .replace("{{name}}", () => esc(v.name))
      .replace("{{line}}", () => esc(v.line))
      .replace("{{domain}}", () => esc(v.domain))
      .replace("{{mark}}", () => (v.mark ? '<img class="mark" src="mark.png" alt="">' : ""))
      .replace("{{visual}}", () =>
        v.visual ? '<div class="visual {{fit}}"><img src="visual.png" alt="" style="--focus: {{focus}}"></div>' : "",
      )
      .replace("{{fit}}", () => (v.fit === "contain" ? "contain" : ""))
      .replace("{{focus}}", () => esc(v.focus ?? "50% 0"));
    writeFileSync(join(dir, "card.html"), html);
    copyFileSync(join(repo, "public/fonts/osifont.woff2"), join(dir, "osifont.woff2"));
    // density keeps an SVG mark sharp; rasters ignore it.
    if (v.visual) await sharp(v.visual).png().toFile(join(dir, "visual.png"));
    if (v.mark)
      await sharp(v.mark, { density: 384 })
        .resize(192, 192, { fit: "contain", background: "#0000" })
        .png()
        .toFile(join(dir, "mark.png"));
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
