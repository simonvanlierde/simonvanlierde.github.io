// schema.org nodes for the project cards. Kept apart from schemaOrg.ts so the
// unit tests can import it: that file reads the CV export through a Vite-only
// `?raw` import.

export const site = "https://simonvanlierde.com";
export const personId = `${site}/#person`;

export interface ProjectCard {
  id: string;
  data: {
    title: string;
    description: string;
    repo: string;
    demo?: string;
    tags: string[];
    links: { label: string; url: string }[];
    figures?: Record<string, Figure>;
  };
}

/** A number on the page, with where it comes from and the date it holds for. */
export interface Figure {
  value: string;
  source: string;
  as_of: string;
}

/**
 * Splits a card description on its `{key}` placeholders, each replaced by the
 * figure of that name. Throws on a placeholder with no figure, or a figure no
 * placeholder uses, or a stray brace, so a typo fails the build instead of
 * shipping "{rooms}".
 */
export function figureParts(text: string, figures: Record<string, Figure> = {}): (string | Figure)[] {
  const used = new Set<string>();
  const parts = text.split(/\{(\w+)\}/).map((part, i) => {
    if (i % 2 === 0) {
      if (/[{}]/.test(part)) throw new Error(`stray brace in "${part}"`);
      return part;
    }
    const figure = Object.hasOwn(figures, part) ? figures[part] : undefined;
    if (!figure) throw new Error(`"{${part}}" has no entry in figures`);
    used.add(part);
    return figure;
  });
  const unused = Object.keys(figures).filter((key) => !used.has(key));
  if (unused.length) throw new Error(`figures not used in the description: ${unused.join(", ")}`);
  return parts.filter((part) => part !== "");
}

/** The description as plain text, figures filled in. */
export const figureText = (text: string, figures?: Record<string, Figure>) =>
  figureParts(text, figures)
    .map((part) => (typeof part === "string" ? part : part.value))
    .join("");

export interface CardLink {
  id: string;
  title: string;
}

/**
 * Each card's `uses` cards and, the other way round, the cards that use
 * it ("used by"). Throws on a `uses` id that is not a card, so a typo
 * fails the build instead of shipping a dead anchor.
 */
export function relatedCards(cards: { id: string; data: { title: string; uses: string[] } }[]) {
  const byId = new Map(cards.map((c) => [c.id, { id: c.id, title: c.data.title }]));
  const related = new Map(cards.map((c) => [c.id, { uses: [] as CardLink[], usedBy: [] as CardLink[] }]));
  for (const card of cards) {
    for (const id of card.data.uses) {
      const target = byId.get(id);
      if (!target) throw new Error(`${card.id}: uses "${id}" is not a project card`);
      related.get(card.id)?.uses.push(target);
      related.get(id)?.usedBy.push({ id: card.id, title: card.data.title });
    }
  }
  return related;
}

/**
 * A card is a dataset when one of its links is labelled "dataset". The card
 * frontmatter has no other signal: `kind` is free text, and a Zenodo "record"
 * can hold software.
 */
const datasetLink = (card: ProjectCard) => card.data.links.find((l) => /dataset/i.test(l.label));

/**
 * One SoftwareSourceCode node per card (name, description and codeRepository
 * are its core properties on schema.org), plus a Dataset node for dataset cards
 * (Google's Dataset rich result requires name and description).
 */
export function projectNodes(cards: ProjectCard[]) {
  return cards.flatMap((card) => {
    const { title, repo, demo, tags } = card.data;
    const description = figureText(card.data.description, card.data.figures);
    const author = { "@id": personId };
    const code = {
      "@type": "SoftwareSourceCode",
      "@id": `${site}/#project-${card.id}`,
      name: title,
      description,
      codeRepository: repo,
      author,
      ...(demo ? { url: demo } : {}),
      ...(tags.length ? { keywords: tags } : {}),
    };
    const link = datasetLink(card);
    if (!link) return [code];
    const dataset = {
      "@type": "Dataset",
      "@id": `${site}/#dataset-${card.id}`,
      name: `${title}: ${link.label}`,
      description,
      url: link.url,
      creator: author,
      isBasedOn: { "@id": code["@id"] },
    };
    return [code, dataset];
  });
}
