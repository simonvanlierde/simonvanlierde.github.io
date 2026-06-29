// Generates public/og.png (the 1200x630 social-share card) from an inline SVG
// via sharp. Mirrors the site's identity: light background, system sans, one
// teal accent. Run with `pnpm gen:og` whenever the look or copy changes.
import sharp from "sharp";

const W = 1200;
const H = 630;

// Pulled from the light palette in src/styles/global.css.
const bg = "#fbfcfc";
const ink = "#1a2024";
const muted = "#56636b";
const accent = "#0f766e";
const border = "#e2e7e9";

const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect width="${W}" height="14" fill="${accent}"/>
  <g font-family="${sans}">
    <text x="80" y="288" font-size="96" font-weight="700" letter-spacing="-3" fill="${ink}">Simon van Lierde</text>
    <text x="82" y="356" font-size="40" font-weight="500" fill="${muted}">Research software engineer &amp; PhD researcher, CML Leiden</text>
    <line x1="82" y1="470" x2="380" y2="470" stroke="${border}" stroke-width="2"/>
    <text x="82" y="408" font-size="32" font-weight="400" fill="${muted}">Open, reproducible research infrastructure for industrial ecology.</text>
    <text x="82" y="540" font-size="30" font-weight="600" fill="${accent}">simonvanlierde.github.io</text>
  </g>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("public/og.png");
console.log("Wrote public/og.png");
