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
    // Extra labelled links (publications, datasets, etc.). A dataset link needs
    // the license URL its record gives, for the Dataset node.
    links: z.array(z.object({ label: z.string(), url: z.url(), license: z.url().optional() })).default([]),
    // Every number in the description, written there as `{key}`: the text shown,
    // the page it comes from, and the date the source gives for it (or, when it
    // gives none, the date of the source version it was checked against).
    figures: z.record(z.string(), z.object({ value: z.string(), source: z.url(), as_of: z.iso.date() })).default({}),
    // Card group: academic or professional ("work"), a side project ("personal"), or a
    // smaller piece shown as one line under the work rows ("minor").
    category: z.enum(["work", "personal", "minor"]).default("work"),
    // Lowest first, within the category.
    order: z.number().default(0),
  }),
});

export const collections = { projects };
