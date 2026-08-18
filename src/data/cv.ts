import { parse } from "yaml";
import { z } from "zod";
// `cv-public.yaml` is exported from the private cv-system repo by
// `just public-export`; never hand-edit it here. The schema below is the
// contract between the two repos: a build fails loudly if an export drops or
// renames a field, rather than silently rendering an empty section.
import { CV_DATE } from "../components/cvPeriod.ts";
import raw from "./cv-public.yaml?raw";
import { PublicationSchema } from "./publications.ts";

// YAML types a bare `2018` as a number, while `2024-04` and `present` arrive as
// strings. Normalise to string so formatPeriod only has one input type, then
// check the shape: `2024-13` would otherwise render as "undefined 2024".
const CvDate = z.union([z.string(), z.number()]).transform(String).pipe(z.string().regex(CV_DATE));

// Required vs optional splits the schema. The spine of a CV (who, what they do,
// where they worked, what they studied) must be present or the build fails
// loudly. Everything a real CV can legitimately lack in a given month defaults to
// empty, and its section then renders not at all. A missing optional section is a
// fact about the CV; a missing required one is a broken export.
const CvSchema = z.object({
  basics: z.object({
    name: z.string(),
    headline: z.string(),
    location: z.string(),
    // Optional: the public export may withhold it. When it is absent, the site
    // drops every mailto rather than inventing an address.
    email: z.email().optional(),
    links: z.object({
      linkedin: z.url(),
      github: z.url(),
      website: z.url(),
    }),
  }),
  profile: z.string(),
  skills: z.array(z.object({ group: z.string(), items: z.array(z.string()) })).default([]),
  experience: z.array(
    z.object({
      organization: z.string(),
      role: z.string(),
      start: CvDate,
      end: CvDate,
      highlights: z.array(z.string()).default([]),
    }),
  ),
  publications: z.array(PublicationSchema).default([]),
  projects: z.array(z.object({ name: z.string(), url: z.url(), summary: z.string() })).default([]),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      start: CvDate,
      end: CvDate,
      details: z.string().optional(),
    }),
  ),
  professional_development: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  // When the private repo generated this file and the PDF beside it. Optional so
  // an export from before the field existed still builds.
  exported: z.iso.datetime().optional(),
});

/** The single source of CV data. Both `/` and `/cv/` render from this object. */
export const cv = CvSchema.parse(parse(raw));

/** Where the exported PDF lands in `public/`. */
export const cvPdf = "/files/simon-van-lierde-cv.pdf";
