import { cv, profiles, sheetLead } from "./cv.ts";
import { personName } from "./personName.ts";
import { type ProjectCard, personId, projectNodes, site } from "./projectSchema.ts";
import { listablePublications, type Publication } from "./publications.ts";

// Structured data uses the same CV, project content and metadata as the visible sheets.

/** Profiles that identify the same person elsewhere. */
const sameAs = [...profiles.map((p) => p.href), cv.basics.links.openalex, cv.basics.links.scholar].filter(Boolean);

const { givenName, familyName } = personName(cv.basics.name);
// How an APA byline names the owner once publications.ts expands it: "S. van Lierde".
const bylineName = `${givenName[0]}. ${familyName}`;

// Spoken languages go in knowsLanguage, without their level: "Dutch (native)" is not a subject.
const isLanguages = (group: { group: string }) => group.group === "Languages";
const languages = cv.skills
  .filter(isLanguages)
  .flatMap((group) => group.items.map((item) => item.replace(/\s*\(.*\)$/, "")));

// "Leiden University & TU Delft" is a joint degree: two schools.
const schools = [...new Set(cv.education.flatMap((e) => e.institution.split(" & ")))];

const person = {
  "@type": "Person",
  "@id": personId,
  name: cv.basics.name,
  givenName,
  familyName,
  jobTitle: sheetLead[0],
  description:
    "Research software engineer building open software and data infrastructure for industrial ecology, at CML, Leiden University.",
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
  knowsAbout: cv.skills.filter((group) => !isLanguages(group)).flatMap((group) => group.items),
  ...(languages.length ? { knowsLanguage: languages } : {}),
};

/** Google's profile-page markup: the page, about the person. */
const profilePage = (path: string) => ({
  "@type": "ProfilePage",
  "@id": `${site}${path}#profilepage`,
  url: `${site}${path}`,
  isPartOf: { "@id": `${site}/#website` },
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
      name === cv.basics.name || name === bylineName ? { "@id": personId } : { "@type": "Person", name },
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

/** The archive keeps structured metadata beside the projects it lists. */
export const archiveJsonLd = (cards: ProjectCard[]) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${site}/archive/#webpage`,
      url: `${site}/archive/`,
      name: "Project archive",
      isPartOf: { "@id": `${site}/#website` },
      author: { "@id": personId },
    },
    person,
    ...projectNodes(cards),
  ],
});

/** The CV page: its profile page, the person, and exactly the publications the page lists. */
export const cvJsonLd = {
  "@context": "https://schema.org",
  "@graph": [profilePage("/cv/"), person, ...listablePublications(cv.publications).map(publicationNode)],
};
