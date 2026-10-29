// Parsing and comparison for scripts/fetch-evidence.mjs and scripts/evidence-drift.mjs, kept free of
// network and file access so tests/unit/evidence.test.ts can feed it fixture responses.
// parseUpstream throws on a response it does not recognise; the caller then keeps the last good file.

/** The merged pull requests in other people's repos, one search. */
export const upstreamQuery = "author:simonvanlierde is:pr is:merged -user:simonvanlierde -user:CMLPlatform";

export const upstreamGraphql = `query($q: String!) { search(query: $q, type: ISSUE, first: 100) { issueCount
  nodes { ... on PullRequest { number baseRefName repository { nameWithOwner defaultBranchRef { name } } } } } }`;

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
      if (!pr?.repository?.nameWithOwner || !pr.number || !pr.baseRefName) {
        throw new Error(`pull request ${pr?.repository?.nameWithOwner ?? "?"}#${pr?.number ?? "?"} is missing a field`);
      }
      return {
        repo: pr.repository.nameWithOwner,
        number: pr.number,
        base: pr.baseRefName,
        default_branch: pr.repository.defaultBranchRef?.name ?? pr.baseRefName,
      };
    })
    .sort((a, b) => a.repo.localeCompare(b.repo) || a.number - b.number);
}

/**
 * Adds as_of: today if the payload changed, else the previous date, so as_of dates the facts. fetched_at is always
 * today: a source that keeps failing leaves it behind, which the drift check reports.
 */
export function withAsOf(previous, payload, today) {
  const { as_of: previousAsOf, fetched_at: _, ...rest } = previous ?? {};
  const unchanged = previousAsOf && JSON.stringify(rest) === JSON.stringify(payload);
  return { as_of: unchanged ? previousAsOf : today, fetched_at: today, ...payload };
}

/** Days after which upstream.json counts as stale; the same limit as stats.json in scripts/check-drift.sh. */
export const maxFetchAgeDays = 21;

/**
 * Markdown for the drift issue.
 * - curated: src/data/upstream.ts `upstream`; leftOut: its list of PRs (`owner/repo#n`) and whole repos
 *   (`owner/repo`) kept off on purpose.
 * - merged: upstream.json's PRs; fetchedAt: its fetched_at (undefined when missing); today: YYYY-MM-DD.
 */
export function evidenceDrift({ curated, leftOut, merged, fetchedAt, today }) {
  const key = (repo, n) => `${repo}#${n}`.toLowerCase();
  const listed = new Set(curated.flatMap((u) => u.prs.map((n) => key(u.repo, n))));
  const skipped = new Set(leftOut.map((k) => k.toLowerCase()));
  const found = new Set(merged.map((pr) => key(pr.repo, pr.number)));
  const lines = [];

  for (const pr of merged) {
    const k = key(pr.repo, pr.number);
    if (!listed.has(k) && !skipped.has(k) && !skipped.has(pr.repo.toLowerCase())) {
      lines.push(`- merged [${pr.repo}#${pr.number}](https://github.com/${pr.repo}/pull/${pr.number}) is not listed`);
    }
  }
  for (const u of curated) {
    for (const n of u.prs) {
      if (!found.has(key(u.repo, n))) lines.push(`- listed \`${u.repo}#${n}\` is not among the merged pull requests`);
    }
  }

  const days = fetchedAt ? (Date.parse(today) - Date.parse(fetchedAt)) / 86_400_000 : Number.NaN;
  if (!(days <= maxFetchAgeDays)) {
    const state = fetchedAt
      ? `was last fetched on ${fetchedAt}, ${days} days ago (limit ${maxFetchAgeDays})`
      : "has no fetched_at date";
    lines.push(`- \`src/data/upstream.json\` ${state}. Check the refresh-data workflow.`);
  }

  return lines.length ? `### Merged upstream (src/data/upstream.ts)\n\n${lines.join("\n")}\n\n` : "";
}
