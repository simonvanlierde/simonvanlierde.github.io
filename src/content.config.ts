import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

// Typed content collection for "Selected work" project cards.
// One markdown file per project under src/content/projects/.
const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    // Display title of the project.
    title: z.string(),
    // Short, honest one or two sentence summary. Plain text.
    description: z.string(),
    // Canonical source repository.
    repo: z.url(),
    // Optional live demo URL.
    demo: z.url().optional(),
    // Technology tags shown as a small list on the card.
    tags: z.array(z.string()).default([]),
    // Extra labelled links (publications, datasets, etc.).
    links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
    // Which group the card belongs to: academic/professional ("work") or a
    // personal side project ("personal"). Drives the two card groups on the page.
    category: z.enum(["work", "personal"]).default("work"),
    // Sort order, lowest first (within the category group).
    order: z.number().default(0),
  }),
});

export const collections = { projects };
