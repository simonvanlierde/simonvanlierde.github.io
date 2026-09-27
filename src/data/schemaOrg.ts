import { cv, profiles } from "./cv.ts";
import { listablePublications } from "./publications.ts";

// Structured data for both pages. It reads the CV export, so it claims nothing
// the visible page does not.

const site = "https://simonvanlierde.github.io";

/** Profiles that identify the same person elsewhere. */
const sameAs = profiles.map((p) => p.href);

const person = {
  "@type": "Person",
  "@id": `${site}/#person`,
  name: cv.basics.name,
  jobTitle: cv.basics.headline,
  description: cv.profile,
  url: `${site}/`,
  sameAs,
  ...(cv.basics.email ? { email: `mailto:${cv.basics.email}` } : {}),
  affiliation: {
    "@type": "Organization",
    name: "Institute of Environmental Sciences (CML), Leiden University",
    url: "https://www.universiteitleiden.nl/en/science/environmental-sciences",
  },
  knowsAbout: cv.skills.flatMap((group) => group.items),
};

/** The landing page: the person only. */
export const personJsonLd = {
  "@context": "https://schema.org",
  ...person,
};

/** The CV page: the person plus exactly the publications the page lists. */
export const cvJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { ...person, mainEntityOfPage: `${site}/cv/` },
    ...listablePublications(cv.publications).map((pub) => ({
      "@type": "ScholarlyArticle",
      headline: pub.title,
      author: pub.authors.map((name) => ({ "@type": "Person", name })),
      isPartOf: { "@type": "Periodical", name: pub.venue },
      datePublished: pub.year,
      ...(pub.doi ? { identifier: `https://doi.org/${pub.doi}`, url: `https://doi.org/${pub.doi}` } : {}),
      ...(pub.status === "published" ? {} : { creativeWorkStatus: pub.status }),
    })),
  ],
};
