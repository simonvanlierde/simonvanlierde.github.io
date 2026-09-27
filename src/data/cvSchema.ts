import { z } from "zod";
// The contract for the private repo's `cv-public.yaml` export. It lives apart
// from cv.ts so `node --test` can import it: plain Node cannot resolve `?raw`.
import { CV_DATE } from "../components/cvPeriod.ts";
import { PublicationSchema } from "./publications.ts";

// YAML reads a bare `2018` as a number: normalise to string, then check the shape.
const CvDate = z.union([z.string(), z.number()]).transform(String).pipe(z.string().regex(CV_DATE));

// A missing required field fails the build. Optional sections default to empty
// and do not render.
export const CvSchema = z.object({
  basics: z.object({
    name: z.string(),
    headline: z.string(),
    location: z.string(),
    // The export may withhold it; the site then renders no mailto.
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
  // Export timestamp. Optional so older exports still build.
  exported: z.iso.datetime({ offset: true }).optional(),
});
