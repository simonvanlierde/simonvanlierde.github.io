// Runs inside the container: screenshots /card/card.html to /card/raw.png.
import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto("file:///card/card.html");
await page.evaluate(async () => {
  await document.fonts.ready;
  window.fit();
});
await page.screenshot({ path: "/card/raw.png" });
await browser.close();
