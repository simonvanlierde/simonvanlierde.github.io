import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";
import { ProjectSchema, validateProjectGraph } from "./data/projectSchema.ts";

const projectLoader = glob({ pattern: "**/*.md", base: "./src/content/projects" });
const projects = defineCollection({
  loader: {
    ...projectLoader,
    async load(context) {
      await projectLoader.load(context);
      validateProjectGraph(
        context.store.values().map((card) => ({ id: card.id, data: ProjectSchema.parse(card.data) })),
      );
    },
  },
  schema: ProjectSchema,
});
// Technical notes: one markdown file per post in src/content/notes/, served at /notes/<id>/.
const notes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    // One sentence, plain text. Feeds the meta description and the RSS item.
    description: z.string(),
    date: z.iso.date(),
  }),
});

export const collections = { projects, notes };
