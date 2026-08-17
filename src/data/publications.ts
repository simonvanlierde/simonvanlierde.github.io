import { z } from "zod";

// Kept out of cv.ts so it stays importable by `node --test`: cv.ts pulls the YAML
// in through Vite's `?raw`, which plain Node cannot resolve.

/**
 * One publication. `authors` accepts either a YAML list or a single comma-joined
 * string, because the two repos are coordinated by hand and a mismatch there
 * should not be a broken build. `status` is an enum so a typo upstream fails the
 * build instead of quietly rendering an unrecognised label.
 */
export const PublicationSchema = z.object({
  authors: z
    .union([z.string(), z.array(z.string())])
    .transform((a) => (Array.isArray(a) ? a : a.split(",")).map((name) => name.trim()).filter(Boolean)),
  title: z.string(),
  venue: z.string(),
  year: z.union([z.string(), z.number()]).transform(String),
  doi: z.string().optional(),
  status: z.enum(["published", "in press", "preprint", "under review"]).default("published"),
});

export type Publication = z.infer<typeof PublicationSchema>;

/**
 * Which publications the site is willing to show. Accepted work always lists.
 * Unaccepted work lists only when it carries a DOI, i.e. only once there is a
 * preprint a reader can actually go and read: a bare "under review" line asks the
 * reader to take the work on trust, and the venue can still change.
 */
export const listablePublications = (pubs: Publication[]): Publication[] =>
  pubs.filter((p) => p.status === "published" || p.status === "in press" || Boolean(p.doi));
