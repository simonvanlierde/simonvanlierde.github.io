import { getCollection } from "astro:content";
import { site } from "../../data/projectSchema.ts";

const xmlEscape = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export const GET = async () => {
  const notes = (await getCollection("notes")).sort((a, b) => b.data.date.localeCompare(a.data.date));
  const items = notes.map((note) => {
    const url = `${site}/notes/${note.id}/`;
    return `    <item>
      <title>${xmlEscape(note.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(note.data.date).toUTCString()}</pubDate>
      <description>${xmlEscape(note.data.description)}</description>
    </item>`;
  });
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Technical notes | Simon van Lierde</title>
    <link>${site}/notes/</link>
    <description>Short technical notes on research software, monitoring and infrastructure.</description>
    <language>en</language>
    <atom:link href="${site}/notes/rss.xml" rel="self" type="application/rss+xml" />
${items.join("\n")}
  </channel>
</rss>
`,
    { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } },
  );
};
