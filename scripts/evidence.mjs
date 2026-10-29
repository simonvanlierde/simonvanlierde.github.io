// Parsing and comparison for scripts/fetch-evidence.mjs and scripts/evidence-drift.mjs, kept free of
// network and file access so tests/unit/evidence.test.ts can feed it fixture responses.
// Each parser throws on a response it does not recognise; the caller then keeps the last good file.

/** The merged pull requests in other people's repos, one search. */
export const upstreamQuery = "author:simonvanlierde is:pr is:merged -user:simonvanlierde -user:CMLPlatform";

export const upstreamGraphql = `query($q: String!) { search(query: $q, type: ISSUE, first: 100) { issueCount
  nodes { ... on PullRequest { number title url mergedAt baseRefName
    repository { nameWithOwner defaultBranchRef { name } } } } } }`;

/** GitHub GraphQL search response to a sorted list of merged PRs. */
export function parseUpstream(body) {
  const search = body?.data?.search;
  if (!Array.isArray(search?.nodes) || search.nodes.length === 0) throw new Error("search returned no pull requests");
  // shortcut: one page of 100; page with `after` once the count passes it.
  if (search.issueCount > search.nodes.length) {
    throw new Error(`search found ${search.issueCount} pull requests but returned ${search.nodes.length}`);
  }
  return search.nodes
    .map((pr) => {
      if (!pr?.repository?.nameWithOwner || !pr.mergedAt || !pr.baseRefName) {
        throw new Error(`pull request ${pr?.url ?? "?"} is missing a field`);
      }
      return {
        repo: pr.repository.nameWithOwner,
        number: pr.number,
        title: pr.title.trim(),
        url: pr.url,
        merged_at: pr.mergedAt.slice(0, 10),
        base: pr.baseRefName,
        default_branch: pr.repository.defaultBranchRef?.name ?? pr.baseRefName,
      };
    })
    .sort((a, b) => a.repo.localeCompare(b.repo) || a.number - b.number);
}

/** Zenodo record ids linked from the given page sources: doi.org/10.5281/zenodo.N or zenodo.org/records/N. */
export const zenodoIds = (text) => [
  ...new Set([...text.matchAll(/(?:10\.5281\/zenodo\.|zenodo\.org\/records\/)(\d+)/g)].map((m) => m[1])),
];

/** A Zenodo record (fetched as /api/records/<id>/versions/latest) to its DOIs and version. */
export function parseZenodo(record) {
  if (!record?.doi || !record?.conceptdoi) throw new Error(`record ${record?.id ?? "?"} has no doi or conceptdoi`);
  return {
    concept_doi: record.conceptdoi,
    latest_doi: record.doi,
    version: record.metadata?.version ?? null,
    published: record.metadata?.publication_date ?? null,
  };
}

/** OpenAlex works response to bare, lower-case DOIs with title, year and type. */
export function parseOpenAlex(body) {
  if (!Array.isArray(body?.results)) throw new Error("response has no results");
  return body.results
    .filter((w) => w.doi)
    .map((w) => ({
      doi: w.doi.replace(/^https:\/\/doi\.org\//, "").toLowerCase(),
      title: w.title,
      year: w.publication_year,
      type: w.type,
    }))
    .sort((a, b) => a.doi.localeCompare(b.doi));
}

/**
 * Adds as_of: today if the payload changed, else the previous date, so the weekly refresh commits only when a fact
 * moves.
 */
export function withAsOf(previous, payload, today) {
  const { as_of: previousAsOf, ...rest } = previous ?? {};
  const unchanged = previousAsOf && JSON.stringify(rest) === JSON.stringify(payload);
  return { as_of: unchanged ? previousAsOf : today, ...payload };
}

/**
 * Markdown lines for the drift issue.
 * - curated: src/data/upstream.ts `upstream`; leftOut: its "owner/repo#n" list of PRs kept off on purpose.
 * - merged, dois, works: the generated files. siteText: every page source that can name a DOI.
 */
export function evidenceDrift({ curated, leftOut, merged, dois, works, siteText }) {
  const key = (repo, n) => `${repo}#${n}`.toLowerCase();
  const listed = new Set(curated.flatMap((u) => u.prs.map((n) => key(u.repo, n))));
  const skipped = new Set(leftOut.map((k) => k.toLowerCase()));
  const found = new Set(merged.map((pr) => key(pr.repo, pr.number)));
  const lines = [];

  for (const pr of merged) {
    const k = key(pr.repo, pr.number);
    if (!listed.has(k) && !skipped.has(k)) lines.push(`- merged [${pr.repo}#${pr.number}](${pr.url}) is not listed`);
  }
  for (const u of curated) {
    for (const n of u.prs) {
      if (!found.has(key(u.repo, n))) lines.push(`- listed \`${u.repo}#${n}\` is not among the merged pull requests`);
    }
  }
  const upstream = lines.splice(0);

  for (const [id, d] of Object.entries(dois)) {
    const linked = `10.5281/zenodo.${id}`;
    if (linked !== d.concept_doi && linked !== d.latest_doi) {
      lines.push(`- Zenodo \`${linked}\` is an old version: link ${d.concept_doi} (all versions) or ${d.latest_doi}`);
    }
  }
  const zenodo = lines.splice(0);

  const site = siteText.toLowerCase();
  for (const w of works) {
    if (!site.includes(w.doi))
      lines.push(`- ${w.type} [${w.title}](https://doi.org/${w.doi}) is on OpenAlex, not here`);
  }

  let report = "";
  const add = (title, items) => {
    if (items.length) report += `### ${title}\n\n${items.join("\n")}\n\n`;
  };
  add("Merged upstream (src/data/upstream.ts)", upstream);
  add("Zenodo links", zenodo);
  add("Publications on OpenAlex missing from the CV export and the cards", lines);
  return report;
}
