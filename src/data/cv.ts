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
 */
export const profiles = [
  { label: "GitHub", href: cv.basics.links.github },
  { label: "ORCID", href: cv.basics.links.orcid },
  { label: "LinkedIn", href: cv.basics.links.linkedin },
  { label: "Leiden profile", href: cv.basics.links.leiden },
];

// The headline reads "role · focus · affiliation". Both sheets open on the same
// lead, the role and the affiliation; the CV sets the focus under it.
const [role, ...headlineRest] = cv.basics.headline.split(" · ");

/** The lead under the name on both sheets: the role, then the affiliation. */
export const sheetLead = [role, headlineRest.at(-1)].filter((part) => part !== undefined);

/** The rest of the headline, for the CV's tagline. */
export const headlineFocus = headlineRest.slice(0, -1).join(" · ");
