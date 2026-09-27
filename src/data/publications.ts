import { z } from "zod";

// Kept out of cv.ts so `node --test` can import it: plain Node cannot resolve `?raw`.

/**
 * One publication. `authors` takes a YAML list or a comma-joined string. An
 * unknown `status` fails the build. `doi` must be the bare identifier, because
 * both consumers prefix the resolver.
 */
export const PublicationSchema = z.object({
  authors: z
    .union([z.string(), z.array(z.string())])
    .transform((a) => (Array.isArray(a) ? a : a.split(",")).map((name) => name.trim()).filter(Boolean)),
  title: z.string(),
  venue: z.string(),
  year: z.union([z.string(), z.number()]).transform(String),
  doi: z
    .string()
    .regex(/^10\.\d{4,9}\/\S+$/)
    .optional(),
  status: z.enum(["published", "in press", "preprint", "under review"]).default("published"),
});

export type Publication = z.infer<typeof PublicationSchema>;

/**
 * Accepted work always lists. Unaccepted work lists only with a DOI, so a reader
 * can open a preprint instead of taking "under review" on trust.
 */
export const listablePublications = (pubs: Publication[]): Publication[] =>
  pubs.filter((p) => p.status === "published" || p.status === "in press" || Boolean(p.doi));
