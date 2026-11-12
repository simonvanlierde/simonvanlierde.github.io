// Reads the metadata fields used by cards; contexts remain data and are never fetched or evaluated.

function licenseUrl(value) {
  const raw = typeof value === "string" ? value : value?.["@id"];
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("license must be an HTTPS URL");
  return url.href;
}

function doiUrl(identifier) {
  const value = typeof identifier === "string" ? identifier : (identifier?.value ?? identifier?.["@id"]);
  if (typeof value !== "string") return undefined;
  const doi = value.replace(/^(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)/i, "");
  if (/^10\.\d{4,9}\/[^\s<>"?#\\]+$/i.test(doi) && !/(?:^|\/)(?:\.|%2e){1,2}(?:\/|$)/i.test(doi)) {
    return `https://doi.org/${doi}`;
  }
  if (/^(?:doi:|10\.)|doi\.org\//i.test(value) || identifier?.propertyID?.toLowerCase() === "doi") {
    throw new Error("identifier contains an invalid DOI");
  }
  return undefined;
}

function text(value) {
  if (typeof value !== "string" || !value.trim()) throw new Error("bibliographic fields must be nonempty text");
  return value;
}

/** Public bibliographic fields, version, DOI and licence; malformed or empty metadata throws. */
export function parseCodemeta(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("CodeMeta must be an object");
  const result = {};
  if (raw.name !== undefined) result.name = text(raw.name);
  if (raw.author !== undefined) {
    result.author = (Array.isArray(raw.author) ? raw.author : [raw.author]).map((author) => {
      if (!author || typeof author !== "object" || Array.isArray(author)) throw new Error("author must be an object");
      const names = Object.fromEntries(
        ["name", "givenName", "familyName"]
          .filter((key) => author[key] !== undefined)
          .map((key) => [key, text(author[key])]),
      );
      if (!Object.keys(names).length) throw new Error("author must have a name");
      return names;
    });
    if (!result.author.length) throw new Error("author must not be empty");
  }
  if (raw.datePublished !== undefined) {
    const date = text(raw.datePublished);
    if (
      !/^\d{4}-\d{2}-\d{2}(?:T.+)?$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date.slice(0, 10)).toISOString().slice(0, 10) !== date.slice(0, 10)
    ) {
      throw new Error("datePublished must be an ISO date or timestamp");
    }
    result.datePublished = date;
  }
  if (raw.version !== undefined) {
    if (typeof raw.version !== "string" || !/^[a-z\d][a-z\d.+_-]{0,99}$/i.test(raw.version)) {
      throw new Error("version must be a short version string");
    }
    result.version = raw.version;
  }
  const identifiers = Array.isArray(raw.identifier) ? raw.identifier : [raw.identifier];
  const dois = identifiers.map(doiUrl).filter(Boolean);
  if (dois.length) result.doi = dois[0];
  if (raw.license !== undefined) {
    const licenses = [...new Set((Array.isArray(raw.license) ? raw.license : [raw.license]).map(licenseUrl))];
    if (!licenses.length) throw new Error("license must not be empty");
    result.license = licenses.length === 1 ? licenses[0] : licenses;
  }
  if (!Object.keys(result).length) throw new Error("CodeMeta has no bibliographic fields, version, DOI or licence");
  return result;
}
