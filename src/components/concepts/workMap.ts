// The work map's model, shared by the three concept sheets under /concepts/.
// Layers, categories and dependencies all come from the project cards, upstream.ts
// and the R9lab row; nothing here is a number but an item number.
import type { CollectionEntry } from "astro:content";
import { upstreamShowcase } from "../../data/upstream.ts";

export type LayerId = "data" | "software" | "models" | "upstream";

// NOTE: provisional layers. The brief has Simon assign each card a `layer` field;
// until then the concepts read this table, and a card missing from it fails the build.
const layerOf: Record<string, LayerId> = {
  relab: "data",
  sourceledger: "data",
  "msc-thesis-ie": "data",
  ai4ie: "data",
  "cml-gallery": "data",
  jsonvet: "software",
  citesync: "software",
  "codemeta-drift": "software",
  "project-templates": "software",
  monitoring: "software",
  "6-second-scribbles": "software",
  bikespot: "software",
  tide: "software",
  scattergories: "software",
  "duinlab-today": "software",
  "integrity-checker": "software",
  "ramascene-explorer": "models",
  "cv-ie-taxonomy": "models",
  "brightway-benchmarks": "models",
  "credit-matrix": "models",
  "io-notebook": "models",
};

export const layers: { id: LayerId; name: string; note: string }[] = [
  { id: "data", name: "Data", note: "what products and places are made of" },
  { id: "software", name: "Software", note: "the tooling research code stands on" },
  { id: "models", name: "Models and tools", note: "analysis a reader can run" },
  { id: "upstream", name: "Upstream", note: "libraries the field already runs on" },
];

const categoryLabel = {
  platform: "Research platform",
  work: "Research tools",
  personal: "Personal apps",
  minor: "Smaller projects",
  upstream: "Merged upstream",
} as const;
type Category = keyof typeof categoryLabel;

export interface Part {
  id: string;
  /** Item number, in keyboard order: layer by layer, top to bottom. */
  n: number;
  title: string;
  kind: string;
  layer: LayerId;
  category: Category;
  /** Where the map goes: the row on this sheet, or the archive register. */
  href: string;
  featured: boolean;
  uses: string[];
  usedBy: string[];
}

export interface Group {
  category: Category;
  label: string;
  parts: Part[];
}

export interface MapLayer {
  id: LayerId;
  name: string;
  note: string;
  groups: Group[];
}

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** R9lab's six parts, for Detail A. Same destinations as the index's Fig. 1. */
export const r9labParts = [
  { id: "rig", name: "Camera rig", href: "https://github.com/CMLPlatform/r9cam" },
  { id: "app", name: "Capture app", href: "https://github.com/CMLPlatform/r9lab/tree/main/app" },
  { id: "web", name: "Web app", href: "https://app.r9lab.io" },
  { id: "api", name: "API", href: "https://docs.r9lab.io/api-reference/" },
  { id: "db", name: "Database", href: "https://docs.r9lab.io/architecture/datamodel/" },
  { id: "docs", name: "Docs", href: "https://docs.r9lab.io" },
];

export function buildWorkMap(cards: CollectionEntry<"projects">[]) {
  const sorted = [...cards].sort((a, b) => a.data.order - b.data.order);
  const raw: Omit<Part, "n" | "usedBy">[] = [
    {
      id: "relab",
      title: "R9lab",
      kind: "research platform",
      layer: "data",
      category: "platform",
      href: "#relab",
      featured: true,
      // As on the index: R9lab is written out there, not a card.
      uses: ["monitoring", "jsonvet"],
    },
    ...sorted.map((c) => {
      const layer = layerOf[c.id];
      if (!layer) throw new Error(`work map: no layer for "${c.id}"`);
      // A card that names an upstream library in its tags uses it.
      const upstreamUses = upstreamShowcase
        .filter((g) => c.data.tags.some((t) => t.toLowerCase() === g.name.toLowerCase()))
        .map((g) => `upstream-${slug(g.name)}`);
      return {
        id: c.id,
        title: c.data.title,
        kind: c.data.kind,
        layer,
        category: c.data.category as Category,
        href: c.data.featured ? `#project-${c.id}` : `/archive/#project-${c.id}`,
        featured: c.data.featured,
        uses: [...c.data.uses, ...upstreamUses],
      };
    }),
    ...upstreamShowcase.map((g) => ({
      id: `upstream-${slug(g.name)}`,
      title: g.name,
      kind: g.lead.text,
      layer: "upstream" as const,
      category: "upstream" as const,
      href: `/archive/#upstream-${slug(g.name)}`,
      featured: false,
      uses: [],
    })),
  ];

  const order: Category[] = ["platform", "work", "personal", "minor", "upstream"];
  const mapLayers: MapLayer[] = layers.map((l) => ({
    ...l,
    groups: order
      .map((category) => ({
        category,
        label: categoryLabel[category],
        parts: [] as Part[],
      }))
      .filter((g) => raw.some((p) => p.layer === l.id && p.category === g.category)),
  }));

  let n = 0;
  const parts = new Map<string, Part>();
  for (const layer of mapLayers) {
    for (const group of layer.groups) {
      for (const p of raw.filter((r) => r.layer === layer.id && r.category === group.category)) {
        const part: Part = { ...p, n: ++n, usedBy: [] };
        group.parts.push(part);
        parts.set(part.id, part);
      }
    }
  }
  for (const part of parts.values()) {
    for (const id of part.uses) {
      const target = parts.get(id);
      if (!target) throw new Error(`work map: ${part.id} uses unknown "${id}"`);
      target.usedBy.push(part.id);
    }
  }
  return { layers: mapLayers, parts };
}

/** Two-digit item number, in the drafting hand. */
export const itemNo = (n: number) => String(n).padStart(2, "0");

/** Starts with the visible number and title (WCAG 2.5.3), then the relations. */
export function partLabel(part: Part, parts: Map<string, Part>) {
  const names = (ids: string[]) => ids.map((id) => parts.get(id)?.title).join(", ");
  const rel = [
    part.uses.length ? `uses ${names(part.uses)}` : "",
    part.usedBy.length ? `used by ${names(part.usedBy)}` : "",
  ].filter(Boolean);
  return `${itemNo(part.n)} ${part.title}: ${part.kind}${rel.length ? `; ${rel.join("; ")}` : ""}`;
}

/** The data attributes the shared map script reads. */
export const partData = (part: Part) => ({
  "data-part": part.id,
  "data-n": part.n,
  "data-uses": part.uses.join(" "),
  "data-usedby": part.usedBy.join(" "),
  "data-layer": part.layer,
});
