// Parsing for scripts/fetch-cards.mjs, kept free of network and file access so tests/unit/cards.test.ts can feed
// it fixture pages.

/** A meta tag's content by its property, whatever the attribute order or line breaks. */
function meta(html, property) {
  for (const tag of html.match(/<meta\b[^>]*>/gis) ?? []) {
    if (new RegExp(`\\bproperty\\s*=\\s*["']${property}["']`, "i").test(tag)) {
      return tag.match(/\bcontent\s*=\s*(["'])(.*?)\1/is)?.[2];
    }
  }
  return undefined;
}

/**
 * A project page's social card: its og:image as an absolute URL (resolved against the page, since some pages give a
 * relative one), or null when the page has no og:image.
 */
export function parseSocialCard(html, pageUrl) {
  const image = meta(html, "og:image");
  return image ? new URL(image, pageUrl).href : null;
}

/** The close-up's shape: 4:3, since the telling parts (a heatmap, a fan) are as tall as they are wide. */
export const CLOSE_UP_ASPECT = 4 / 3;

/**
 * The region of a card to cut for its close-up, in source pixels. `focus` gives the centre as fractions of the card
 * (x 0 to 1 from the left, y from the top) and how far to zoom in: the cut is 1/zoom of the card's width, or as much
 * as the card's height allows. The region stays inside the card, so a focus near an edge slides it inward.
 */
export function closeUp({ width, height }, { x = 0.5, y = 0.5, zoom = 1 } = {}) {
  let w = width / zoom;
  let h = w / CLOSE_UP_ASPECT;
  if (h > height) [h, w] = [height, height * CLOSE_UP_ASPECT];
  const clamp = (v, max) => Math.round(Math.min(Math.max(v, 0), max));
  return {
    left: clamp(x * width - w / 2, width - w),
    top: clamp(y * height - h / 2, height - h),
    width: Math.round(w),
    height: Math.round(h),
  };
}
