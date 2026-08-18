// Generates public/og.png (the 1200x630 social-share card) from an inline SVG
// via sharp. Mirrors the site's identity: the engineering drawing sheet, in
// its ink-on-paper rendering, with the exploded RELab figure and the sheet
// frame. Run with `pnpm gen:og` whenever the look or copy changes.
//
// osifont renders only if installed on the generating machine; the fallback
// sans still reads as the sheet because the frame and figure carry the world.
import sharp from "sharp";

const W = 1200;
const H = 630;

// The light palette from src/styles/global.css, resolved to sRGB.
const bg = "#f8f7f3"; // --bg        oklch(97.5% 0.005 95)
const ink = "#181d24"; // --text      oklch(23% 0.015 255)
const muted = "#49515b"; // --text-muted oklch(43% 0.02 255)
const accent = "#234993"; // --accent  oklch(42% 0.13 262)
const stamp = "#15632f"; // --stamp   oklch(44% 0.11 150)
const frame = "#2c333d"; // --border-strong oklch(32% 0.02 255)

const draft = "'osifont', 'DIN Alternate', 'Bahnschrift', 'Segoe UI', Roboto, Helvetica, sans-serif";

// A compact echo of the site's Fig. 1: RELab taken apart on its axis, six
// parts, capture end at the top: camera rig, capture app, web app, API,
// database, docs. Balloons on the right, as on the sheet.
const X = 985;
const balloon = (y, n) =>
  `<line x1="${X + 70}" y1="${y}" x2="${X + 108}" y2="${y}" stroke="${frame}" stroke-width="1.5"/>
   <circle cx="${X + 120}" cy="${y}" r="12" fill="${bg}" stroke="${frame}" stroke-width="2"/>
   <text x="${X + 120}" y="${y + 5}" font-family="${draft}" font-size="15" text-anchor="middle" fill="${ink}" stroke="none">${n}</text>`;
const relab = `
  <g stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <line x1="${X}" y1="48" x2="${X}" y2="590" stroke="${frame}" stroke-width="1.5" stroke-dasharray="18 7 3 7"/>
    <!-- 1 camera rig -->
    <rect x="${X - 60}" y="60" width="120" height="70"/>
    <rect x="${X - 20}" y="78" width="40" height="40"/>
    <circle cx="${X}" cy="98" r="11"/>
    <g stroke="${muted}" stroke-width="1.5">
      <circle cx="${X - 52}" cy="68" r="2.5"/><circle cx="${X + 52}" cy="68" r="2.5"/>
      <circle cx="${X - 52}" cy="122" r="2.5"/><circle cx="${X + 52}" cy="122" r="2.5"/>
    </g>
    ${balloon(95, 1)}
    <!-- 2 capture app -->
    <rect x="${X - 34}" y="156" width="68" height="112"/>
    <rect x="${X - 27}" y="168" width="54" height="88" stroke="${muted}" stroke-width="1.5"/>
    <circle cx="${X}" cy="212" r="7"/>
    ${balloon(212, 2)}
    <!-- 3 web app -->
    <rect x="${X - 70}" y="292" width="140" height="84"/>
    <g stroke="${muted}" stroke-width="1.5">
      <line x1="${X - 70}" y1="308" x2="${X + 70}" y2="308"/>
      <line x1="${X - 58}" y1="326" x2="${X + 58}" y2="326"/>
      <line x1="${X - 58}" y1="344" x2="${X + 58}" y2="344"/>
      <line x1="${X - 58}" y1="362" x2="${X + 58}" y2="362"/>
    </g>
    ${balloon(334, 3)}
    <!-- 4 api -->
    <rect x="${X - 60}" y="400" width="120" height="34"/>
    <circle cx="${X + 46}" cy="417" r="3"/>
    ${balloon(417, 4)}
    <!-- 5 database -->
    <ellipse cx="${X}" cy="462" rx="42" ry="10"/>
    <line x1="${X - 42}" y1="462" x2="${X - 42}" y2="512"/>
    <line x1="${X + 42}" y1="462" x2="${X + 42}" y2="512"/>
    <path d="M${X - 42} 512 A42 10 0 0 0 ${X + 42} 512"/>
    <path d="M${X - 42} 487 A42 10 0 0 0 ${X + 42} 487" stroke="${muted}" stroke-width="1.5"/>
    ${balloon(487, 5)}
    <!-- 6 docs -->
    <rect x="${X - 40}" y="536" width="80" height="52"/>
    <g stroke="${muted}" stroke-width="1.5">
      <line x1="${X - 28}" y1="536" x2="${X - 28}" y2="588"/>
      <line x1="${X - 18}" y1="552" x2="${X + 30}" y2="552"/>
      <line x1="${X - 18}" y1="564" x2="${X + 30}" y2="564"/>
    </g>
    ${balloon(562, 6)}
  </g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect x="18" y="18" width="${W - 36}" height="${H - 36}" fill="none" stroke="${frame}" stroke-width="3"/>
  ${relab}
  <g font-family="${draft}">
    <text x="80" y="200" font-size="84" letter-spacing="4" fill="${ink}">SIMON VAN LIERDE</text>
    <text x="82" y="272" font-size="34" fill="${muted}">Open software and open data</text>
    <text x="82" y="316" font-size="34" fill="${muted}">for sustainability research.</text>
    <text x="82" y="400" font-size="26" letter-spacing="2" fill="${ink}">PHD RESEARCHER · RESEARCH SOFTWARE ENGINEER</text>
    <text x="82" y="438" font-size="26" letter-spacing="2" fill="${muted}">CML, LEIDEN UNIVERSITY</text>
    <text x="82" y="540" font-size="28" letter-spacing="2" fill="${accent}">SIMONVANLIERDE.GITHUB.IO</text>
  </g>
  <g font-family="${draft}">
    <rect x="80" y="48" width="118" height="44" fill="none" stroke="${stamp}" stroke-width="3"/>
    <text x="98" y="77" font-size="22" letter-spacing="3" fill="${stamp}">SHEET 1</text>
  </g>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("public/og.png");
console.log("Wrote public/og.png");
