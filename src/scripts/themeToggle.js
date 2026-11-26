const btn = document.querySelector(".theme-toggle");
const meta = document.querySelector('meta[name="theme-color"]');

// Blocked storage stops the toggle remembering the theme, not applying it.
const remember = (v) => {
  try {
    localStorage.setItem("theme", v);
  } catch {
    // Keep the current theme without saving it.
  }
};

// Dark unless the visitor picked light; global.css sets the same default.
const isDark = () => document.documentElement.dataset.theme !== "light";

// Computed styles serialise --bg as oklch(), which theme-color parsers
// may not accept. A 1px canvas converts it to plain sRGB.
const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
const toRgb = (color) => {
  if (!ctx) return color;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
};

// btn is optional: some pages have no toggle.
const sync = () => {
  const dark = isDark();
  meta.content = toRgb(getComputedStyle(document.body).backgroundColor);
  btn?.setAttribute("aria-pressed", String(dark));
};

btn?.addEventListener("click", () => {
  const next = isDark() ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  remember(next);
  sync();
});

sync();
