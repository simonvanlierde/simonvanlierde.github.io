import { z } from "zod";
// schema.org nodes for the project cards. Kept apart from schemaOrg.ts so the
// unit tests can import it: that file reads the CV export through a Vite-only
// `?raw` import.
import codemeta from "./codemeta.json" with { type: "json" };
import { upstream } from "./upstream.ts";

export interface ProjectMetadata {
  name?: string;
  author?: { name?: string; givenName?: string; familyName?: string }[];
  datePublished?: string;
  version?: string;
  doi?: string;
  license?: string | string[];
  fetched_at: string;
  sourceId?: string;
  citation?: {
    apa: string;
    downloads: { apa: string; bibtex: string; cslJson: string; jsonld: string };
  };
}

export const projectMetadata = (repo: string): ProjectMetadata | undefined =>
  (codemeta as Record<string, ProjectMetadata>)[repo];

export const threadIds = [
  "circular-data-economy",
  "footprints-and-flows",
  "open-and-fair-research-software",
  "open-and-reproducible-ml",
  "tools-that-respect-people",
  "built-to-scale-and-last",
] as const;
export const roleIds = ["researchers", "builders", "policy", "practitioners", "public"] as const;

/** Validate references before deriving links or drawing the work graph. */
export function validateProjectGraph(
  cards: { id: string; data: Pick<ProjectData, "builds_on" | "tooling" | "fixes"> }[],
) {
  const byId = new Map(cards.map((card) => [card.id, card]));
  if (byId.size !== cards.length) throw new Error("duplicate project id");
  const libraries = new Set(upstream.map((library) => library.repo));
  for (const card of cards) {
    for (const field of ["builds_on", "tooling", "fixes"] as const) {
      const seen = new Set<string>();
      for (const id of card.data[field]) {
        if (id === card.id) throw new Error(`${card.id}: ${field} cannot reference itself`);
        if (seen.has(id)) throw new Error(`${card.id}: ${field} references "${id}" twice`);
        seen.add(id);
        const valid =
          field === "fixes"
            ? libraries.has(id)
            : field === "tooling"
              ? byId.has(id)
              : byId.has(id) || libraries.has(id);
        if (!valid) throw new Error(`${card.id}: ${field} "${id}" is not a known dependency`);
      }
    }
  }
  const visited = new Set<string>();
  const visit = (id: string, path: string[]) => {
    if (path.includes(id)) throw new Error(`builds_on cycle: ${[...path, id].join(" → ")}`);
    if (visited.has(id)) return;
    for (const next of byId.get(id)?.data.builds_on ?? []) {
      if (byId.has(next)) visit(next, [...path, id]);
    }
    visited.add(id);
  };
  for (const card of cards) visit(card.id, []);
}

export const ProjectSchema = z
  .strictObject({
    title: z.string(),
    // One or two honest sentences, plain text.
    description: z.string(),
    repo: z.url(),
    demo: z.url().optional(),
    // The kind of artefact in two or three words ("pre-commit hook"). Fills the
    // plate's left rail.
    kind: z.string(),
    tags: z.array(z.string()).default([]),
    // Extra labelled links (publications, datasets, etc.). A dataset link needs
    // the license URL its record gives, for the Dataset node.
    links: z.array(z.strictObject({ label: z.string(), url: z.url(), license: z.url().optional() })).default([]),
    // Every number in the description, written there as `{key}`: the text shown,
    // the page it comes from, and the date the source gives for it (or, when it
    // gives none, the date of the source version it was checked against).
    figures: z
      .record(z.string(), z.strictObject({ value: z.string(), source: z.url(), as_of: z.iso.date() }))
      .default({}),
    // Project category is independent of its featured selection.
    category: z.enum(["work", "personal", "minor"]).default("work"),
    layer: z.enum(["data", "software", "tools-and-apps"]),
    threads: z.array(z.enum(threadIds)).min(1),
    builds_on: z.array(z.string()).default([]),
    tooling: z.array(z.string()).default([]),
    extracts: z
      .array(
        z.strictObject({
          reservoir: z.enum(["products", "buildings", "economy"]),
          stock: z.number().nonnegative(),
          unit: z.string().min(1),
          source: z.url(),
          as_of: z.iso.date(),
        }),
      )
      .default([]),
    serves: z.array(z.enum(roleIds)).default([]),
    could_serve: z.array(z.enum(roleIds)).default([]),
    fixes: z.array(z.string()).default([]),
    // A featured card leads the work list and shows its demo's social card beside the text.
    featured: z.boolean().default(false),
    // Where a featured card's close-up is cut from its demo's social card: the centre as fractions of the card
    // (x from the left, y from the top) and the zoom, the card's width over the close-up's. Read by
    // scripts/fetch-cards.mjs; 2.5 keeps a 1200px card's close-up at its 480px file size or more.
    image_focus: z
      .strictObject({
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        zoom: z.number().min(1).max(2.5).default(1),
      })
      .optional(),
    // Lowest first, within the category.
    order: z.number().default(0),
  })
  .superRefine((card, ctx) => {
    const doi = projectMetadata(card.repo)?.doi;
    if (!doi) return;
    for (const [index, link] of card.links.entries()) {
      const url = new URL(link.url);
      if (
        ["doi.org", "dx.doi.org"].includes(url.hostname.toLowerCase()) &&
        url.pathname.replace(/\/$/, "").toLowerCase() === new URL(doi).pathname.toLowerCase()
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["links", index, "url"],
          message: "DOI is supplied by CodeMeta; remove the duplicate card link",
        });
      }
    }
  });
export type ProjectData = z.infer<typeof ProjectSchema>;

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
    links: { label: string; url: string; license?: string }[];
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
  /** In-page anchor, when the row is not a generated `#project-<id>` card. */
  href?: string;
}

/** Tooling links and their reverse links for the project register. */
export function relatedCards(
  cards: { id: string; data: { title: string; tooling: string[]; builds_on: string[]; fixes: string[] } }[],
) {
  validateProjectGraph(cards);
  const byId = new Map(cards.map((c) => [c.id, { id: c.id, title: c.data.title }]));
  const related = new Map(cards.map((c) => [c.id, { tooling: [] as CardLink[], toolingFor: [] as CardLink[] }]));
  for (const card of cards) {
    for (const id of card.data.tooling) {
      const target = byId.get(id);
      if (target) related.get(card.id)?.tooling.push(target);
      related.get(id)?.toolingFor.push({ id: card.id, title: card.data.title });
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

/** Card tags that name a programming language, lower-cased. */
const languages = new Set(["python", "rust", "typescript", "javascript", "go", "bash", "shell", "sql"]);

/**
 * One SoftwareSourceCode node per card (name, description and codeRepository
 * are its core properties on schema.org), plus a Dataset node for dataset cards
 * (Google's Dataset rich result requires name and description, and Search
 * Console flags one without a license). Throws on a dataset link with no
 * license, so the build fails instead.
 */
export function projectNodes(cards: ProjectCard[]) {
  return cards.flatMap((card) => {
    const { title, repo, demo, tags } = card.data;
    const metadata = projectMetadata(repo);
    const description = figureText(card.data.description, card.data.figures);
    const author = { "@id": personId };
    const isLanguage = (tag: string) => languages.has(tag.toLowerCase());
    const programmingLanguage = tags.filter(isLanguage);
    const keywords = tags.filter((tag) => !isLanguage(tag));
    const code = {
      "@type": "SoftwareSourceCode",
      "@id": `${site}/#project-${card.id}`,
      name: title,
      description,
      codeRepository: repo,
      author,
      ...(demo ? { url: demo } : {}),
      ...(metadata?.version ? { version: metadata.version } : {}),
      ...(metadata?.doi ? { identifier: metadata.doi } : {}),
      ...(metadata?.license ? { license: metadata.license } : {}),
      ...(programmingLanguage.length ? { programmingLanguage } : {}),
      ...(keywords.length ? { keywords } : {}),
    };
    const link = datasetLink(card);
    if (!link) return [code];
    if (!link.license) throw new Error(`${card.id}: the "${link.label}" link has no license`);
    const dataset = {
      "@type": "Dataset",
      "@id": `${site}/#dataset-${card.id}`,
      name: `${title}: ${link.label}`,
      description,
      url: link.url,
      license: link.license,
      creator: author,
      isBasedOn: { "@id": code["@id"] },
    };
    return [code, dataset];
  });
}
