// schema.org nodes for the project cards. Kept apart from schemaOrg.ts so the
// unit tests can import it: that file reads the CV export through a Vite-only
// `?raw` import.

export const site = "https://simonvanlierde.github.io";
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
  };
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
    const { title, description, repo, demo, tags } = card.data;
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
