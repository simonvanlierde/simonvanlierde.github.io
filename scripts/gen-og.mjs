// Generates public/og.png (the 1200x630 social-share card) from an inline SVG
// via sharp. Mirrors the site's identity: the engineering drawing sheet, in
// its ink-on-paper rendering, with the exploded-kettle figure and the sheet
// frame. Run with `pnpm gen:og` whenever the look or copy changes.
//
// osifont renders only if installed on the generating machine; the fallback
// sans still reads as the sheet because the frame and figure carry the world.
import sharp from "sharp";

const W = 1200;
const H = 630;

// Pulled from the light palette in src/styles/global.css.
const bg = "#f6f5f0";
const ink = "#25292e";
const muted = "#5c646d";
const accent = "#2c53a5"; // engineer's blue
const stamp = "#a83a32"; // checker's red
const frame = "#3d434a";

const draft = "'osifont', 'DIN Alternate', 'Bahnschrift', 'Segoe UI', Roboto, Helvetica, sans-serif";

// A compact echo of the site's exploded kettle: lid, body, plate, base.
const kettle = `
  <g stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <line x1="985" y1="60" x2="985" y2="560" stroke="${frame}" stroke-width="1.5" stroke-dasharray="18 7 3 7"/>
    <circle cx="985" cy="88" r="9"/>
    <path d="M918 132 Q985 96 1052 132"/>
    <ellipse cx="985" cy="133" rx="67" ry="10"/>
    <ellipse cx="985" cy="205" rx="62" ry="10"/>
    <path d="M923 205 L912 385"/>
    <path d="M1047 205 L1058 385"/>
    <ellipse cx="985" cy="386" rx="73" ry="11"/>
    <path d="M925 216 L892 240 L917 256"/>
    <path d="M1051 225 Q1108 240 1099 297 Q1092 336 1055 345"/>
    <ellipse cx="985" cy="452" rx="60" ry="10"/>
    <path d="M925 452 L925 466"/>
    <path d="M1045 452 L1045 466"/>
    <ellipse cx="985" cy="466" rx="60" ry="10"/>
    <ellipse cx="985" cy="525" rx="80" ry="12"/>
    <path d="M905 525 L905 551"/>
    <path d="M1065 525 L1065 551"/>
    <ellipse cx="985" cy="551" rx="80" ry="12"/>
  </g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect x="18" y="18" width="${W - 36}" height="${H - 36}" fill="none" stroke="${frame}" stroke-width="3"/>
  ${kettle}
  <g font-family="${draft}">
    <text x="80" y="200" font-size="84" letter-spacing="4" fill="${ink}">SIMON VAN LIERDE</text>
    <text x="82" y="272" font-size="34" fill="${muted}">Open software and open data</text>
    <text x="82" y="316" font-size="34" fill="${muted}">for sustainability research.</text>
    <text x="82" y="400" font-size="26" letter-spacing="2" fill="${ink}">PHD RESEARCHER · RESEARCH SOFTWARE ENGINEER</text>
    <text x="82" y="438" font-size="26" letter-spacing="2" fill="${muted}">CML, LEIDEN UNIVERSITY</text>
    <text x="82" y="540" font-size="28" letter-spacing="2" fill="${accent}">SIMONVANLIERDE.GITHUB.IO</text>
  </g>
  <g font-family="${draft}">
    <rect x="820" y="44" width="118" height="44" fill="none" stroke="${stamp}" stroke-width="3"/>
    <text x="838" y="73" font-size="22" letter-spacing="3" fill="${stamp}">SHEET 1</text>
  </g>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("public/og.png");
console.log("Wrote public/og.png");
