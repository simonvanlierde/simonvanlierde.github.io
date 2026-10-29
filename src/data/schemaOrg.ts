import { cv, profiles, sheetLead } from "./cv.ts";
import { type ProjectCard, personId, projectNodes, site } from "./projectSchema.ts";
import { listablePublications, type Publication } from "./publications.ts";

// Structured data for both pages. It reads the CV export, so it claims nothing
// the visible page does not.

/** Profiles that identify the same person elsewhere. */
const sameAs = profiles.map((p) => p.href);

// shortcut: first word is the given name, which holds for "Simon van Lierde"; split
// it in the export if a name ever needs more.
const [givenName, ...family] = cv.basics.name.split(" ");
const familyName = family.join(" ");

// "Leiden University & TU Delft" is a joint degree: two schools.
const schools = [...new Set(cv.education.flatMap((e) => e.institution.split(" & ")))];

const person = {
  "@type": "Person",
  "@id": personId,
  name: cv.basics.name,
  givenName,
  familyName,
  jobTitle: sheetLead[0],
  description: cv.profile,
  url: `${site}/`,
  image: `${site}/portrait.jpg`,
  sameAs,
  identifier: {
    "@type": "PropertyValue",
    propertyID: "ORCID",
    value: new URL(cv.basics.links.orcid).pathname.slice(1),
    url: cv.basics.links.orcid,
  },
  ...(cv.basics.email ? { email: `mailto:${cv.basics.email}` } : {}),
  worksFor: { "@type": "CollegeOrUniversity", name: "Leiden University", url: "https://www.universiteitleiden.nl/en" },
  affiliation: {
    "@type": "Organization",
    name: "Institute of Environmental Sciences (CML), Leiden University",
    url: "https://www.universiteitleiden.nl/en/science/environmental-sciences",
  },
  alumniOf: schools.map((name) => ({ "@type": "CollegeOrUniversity", name })),
  knowsAbout: cv.skills.flatMap((group) => group.items),
};

/** Google's profile-page markup: the page, about the person. */
const profilePage = (path: string) => ({
  "@type": "ProfilePage",
  "@id": `${site}${path}#profilepage`,
  url: `${site}${path}`,
  ...(cv.exported ? { dateModified: cv.exported } : {}),
  mainEntity: { "@id": personId },
});

/** The site name Google shows in results. */
const website = {
  "@type": "WebSite",
  "@id": `${site}/#website`,
  name: cv.basics.name,
  alternateName: new URL(site).hostname,
  url: `${site}/`,
  publisher: { "@id": personId },
};

// Venues that host a work rather than publish it as part of a periodical.
const repositories = new Set(["Zenodo", "Research Square"]);

/** A listed publication. A Zenodo software release is code, not an article. */
function publicationNode(pub: Publication) {
  const software = /\(software\b/i.test(pub.title);
  const doi = pub.doi ? `https://doi.org/${pub.doi}` : undefined;
  return {
    "@type": software ? "SoftwareSourceCode" : "ScholarlyArticle",
    ...(doi ? { "@id": doi, identifier: doi, url: doi } : {}),
    [software ? "name" : "headline"]: pub.title,
    author: pub.authors.map((name) =>
      name === cv.basics.name || name.endsWith(` ${familyName}`) ? { "@id": personId } : { "@type": "Person", name },
    ),
    ...(repositories.has(pub.venue)
      ? { publisher: { "@type": "Organization", name: pub.venue } }
      : { isPartOf: { "@type": "Periodical", name: pub.venue } }),
    datePublished: pub.year,
    ...(pub.status === "published" ? {} : { creativeWorkStatus: pub.status }),
  };
}

/** The landing page: the site, its profile page, the person, and a node per project card. */
export const homeJsonLd = (cards: ProjectCard[]) => ({
  "@context": "https://schema.org",
  "@graph": [website, profilePage("/"), person, ...projectNodes(cards)],
});

/** The CV page: its profile page, the person, and exactly the publications the page lists. */
export const cvJsonLd = {
  "@context": "https://schema.org",
  "@graph": [profilePage("/cv/"), person, ...listablePublications(cv.publications).map(publicationNode)],
};
