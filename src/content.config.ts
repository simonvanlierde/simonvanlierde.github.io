import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

// "Selected work" cards: one markdown file per project in src/content/projects/.
const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    // One or two honest sentences, plain text.
    description: z.string(),
    repo: z.url(),
    demo: z.url().optional(),
    // The kind of artefact in two or three words ("pre-commit hook"). Fills the
    // plate's left rail.
    kind: z.string(),
    tags: z.array(z.string()).default([]),
    // Extra labelled links (publications, datasets, etc.).
    links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
    // Card group: academic or professional ("work"), or a side project ("personal").
    category: z.enum(["work", "personal"]).default("work"),
    // Lowest first, within the category.
    order: z.number().default(0),
  }),
});

export const collections = { projects };
