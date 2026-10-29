import { z } from "zod";

// Kept out of cv.ts so `node --test` can import it: plain Node cannot resolve `?raw`.

/**
 * Full names from an APA byline: "Rankin, K. H., van Lierde, S., & Hawes, J. K"
 * gives ["K. H. Rankin", "S. van Lierde", "J. K. Hawes"]. Throws when the parts
 * do not pair up as surname and initials, so a byline in another style fails
 * the build instead of turning initials into authors.
 */
export function apaAuthors(byline: string): string[] {
  const parts = byline
    .replace(/&/g, "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const names: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const [surname, initials] = [parts[i], parts[i + 1]];
    if (!initials || !/^[A-Z][A-Z.\s-]*$/.test(initials)) {
      throw new Error(`"${byline}" is not an APA byline (Surname, I. I., & Surname, I.)`);
    }
    // APA ends each initial with a period; an export may drop the last one.
    names.push(`${initials.replace(/([A-Z])(?![.\w])/g, "$1.")} ${surname}`);
  }
  return names;
}

/**
 * One publication. `authors` takes a YAML list of full names or an APA byline
 * string; `byline` keeps it as written for the page, `authors` holds full names. An unknown `status` fails the build. `doi` must be the bare
 * identifier, because both consumers prefix the resolver.
 */
export const PublicationSchema = z
  .object({
    authors: z.union([z.string(), z.array(z.string())]),
    title: z.string(),
    venue: z.string(),
    year: z.union([z.string(), z.number()]).transform(String),
    doi: z
      .string()
      .regex(/^10\.\d{4,9}\/\S+$/)
      .optional(),
    status: z.enum(["published", "in press", "preprint", "under review"]).default("published"),
  })
  .transform((p) => ({
    ...p,
    // The page shows the byline as given; the structured data needs full names.
    byline: Array.isArray(p.authors) ? p.authors.join(", ") : p.authors,
    authors: Array.isArray(p.authors) ? p.authors.map((name) => name.trim()).filter(Boolean) : apaAuthors(p.authors),
  }));

export type Publication = z.infer<typeof PublicationSchema>;

/**
 * Accepted work always lists. Unaccepted work lists only with a DOI, so a reader
 * can open a preprint instead of taking "under review" on trust.
 */
export const listablePublications = (pubs: Publication[]): Publication[] =>
  pubs.filter((p) => p.status === "published" || p.status === "in press" || Boolean(p.doi));
