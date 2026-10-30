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
