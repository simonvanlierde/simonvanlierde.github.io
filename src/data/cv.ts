import { parse } from "yaml";
// `cv-public.yaml` is exported from the private cv-system repo by
// `just public-export`; never hand-edit it here. The schema in cvSchema.ts is
// the contract between the two repos: a build fails loudly if an export drops
// or renames a field, rather than silently rendering an empty section.
import raw from "./cv-public.yaml?raw";
import { CvSchema } from "./cvSchema.ts";

/** The single source of CV data. Both `/` and `/cv/` render from this object. */
export const cv = CvSchema.parse(parse(raw));

/** Where the exported PDF lands in `public/`. */
export const cvPdf = "/files/simon-van-lierde-cv.pdf";

/**
 * The author's profiles, in the order a reader vets them: code first, then the
 * academic record, then the professional and institutional pages. One list, so
 * the hero and the title block cannot drift apart. GitHub and LinkedIn come
 * from the export; ORCID and the Leiden page have no export field yet and are
 * kept by hand.
 * NOTE: move ORCID and the Leiden URL into the private repo's public export.
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
