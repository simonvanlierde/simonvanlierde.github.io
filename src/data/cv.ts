import { parse } from "yaml";
// `cv-public.yaml` comes from the private cv-system repo (`just public-export`).
// Do not hand-edit it.
import raw from "./cv-public.yaml?raw";
import { CvSchema } from "./cvSchema.ts";

/** The single source of CV data. Both `/` and `/cv/` render from this object. */
export const cv = CvSchema.parse(parse(raw));

/** Where the exported PDF lands in `public/`. */
export const cvPdf = "/files/simon-van-lierde-cv.pdf";

/**
 * Author profiles in the order a reader vets them, shared by the hero and the
 * title block so they cannot drift apart.
 * NOTE: ORCID and the Leiden URL have no export field yet. Move them into the
 * private repo's public export.
 */
export const profiles = [
  { label: "GitHub", href: cv.basics.links.github },
  { label: "ORCID", href: "https://orcid.org/0009-0006-6953-909X" },
  { label: "LinkedIn", href: cv.basics.links.linkedin },
  {
    label: "Leiden profile",
    href: "https://www.universiteitleiden.nl/en/staffmembers/simon-van-lierde",
  },
];
