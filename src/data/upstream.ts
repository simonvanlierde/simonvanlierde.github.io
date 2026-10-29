// Merged pull requests in other people's projects, most telling first: wrong
// results and measured speed-ups in LCA and industrial-ecology libraries lead,
// tooling and docs follow.
// The ranking, grouping and wording are mine. The branch each PR went into comes from
// src/data/upstream.json, which scripts/fetch-evidence.mjs generates; the drift check flags
// a merged PR that is neither here nor in `leftOut`.
import merged from "./upstream.json" with { type: "json" };

/**
 * Merged PRs kept off on purpose: `owner/repo#n` for one PR (list entries for my own projects or
 * employers), `owner/repo` for every PR in a repo I contribute to out of personal interest.
 */
export const leftOut = [
  "ASSERT-KTH/awesome-open-science-software#28",
  "helenahartmann/awesome-PhD#51",
  "open-wanderer/wanderer",
  "pogopaule/awesome-sustainability-jobs#21",
];

export interface UpstreamProject {
  name: string;
  repo: string;
  what: string;
  prs: number[];
}

export const upstream: UpstreamProject[] = [
  {
    name: "lca_algebraic",
    repo: "oie-mines-paristech/lca_algebraic",
    what: "fixed truncated-normal and lognormal sampling, method lookup and a cache that went stale across time zones; halved the time to expand parameters, and made Sobol analysis about 20× faster when second-order indices are not needed",
    prs: [106, 107, 108, 109, 110],
  },
  {
    name: "Brightway (bw2calc)",
    repo: "brightway-lca/brightway2-calc",
    what: "fixed normalized and weighted scores that went stale after a new impact assessment, and a cutoff that broke on negative scores",
    prs: [167, 168],
  },
  {
    name: "pymrio",
    repo: "IndEcol/pymrio",
    what: "made one step of the account calculation 26× faster with identical results, fixed three small bugs, and got the development test job passing again",
    prs: [179, 180, 181],
  },
  {
    name: "Brightway (stats_arrays)",
    repo: "brightway-lca/stats_arrays",
    what: "stopped loading scipy.stats at import, which makes importing bw2calc and bw2data about 0.3 s faster",
    prs: [43],
  },
  {
    name: "flodym",
    repo: "pik-piam/flodym",
    what: "stopped lifetime extension from overwriting the model's parameters, and made it about 9× faster",
    prs: [198],
  },
  {
    name: "bw_timex",
    repo: "brightway-lca/bw_timex",
    what: "made building the time-explicit matrices 3 to 4× faster, with identical matrices and scores",
    prs: [244],
  },
  {
    name: "premise",
    repo: "polca/premise",
    what: "fixed two bugs in how external scenarios apply efficiency changes, one of which scaled flows they were meant to leave alone",
    prs: [316, 317],
  },
  {
    name: "Activity Browser",
    repo: "LCA-ActivityBrowser/activity-browser",
    what: "kept parameter amounts editable, loaded scenario files with empty keys, and kept a Monte Carlo seed of 0",
    prs: [1743, 1744],
  },
  {
    name: "SALib",
    repo: "SALib/SALib",
    what: "let ProblemSpec take samples and results as plain lists, and gave a clear error for anything that is not numbers",
    prs: [700],
  },
  {
    name: "Brightway (bw2data)",
    repo: "brightway-lca/brightway2-data",
    what: "upgraded deepdiff past two security advisories without breaking saved project revisions",
    prs: [295],
  },
  {
    name: "Boavizta API",
    repo: "Boavizta/boaviztapi",
    what: "made the use phase return values for six impact criteria that said 'not implemented'",
    prs: [583],
  },
  {
    name: "CodeMeta",
    repo: "codemeta/codemeta",
    what: "fixed the GitHub crosswalk, which mapped a project's name to its owner/repo path",
    prs: [505],
  },
  {
    name: "SchemaStore",
    repo: "SchemaStore/schemastore",
    what: "added sourceledger's config schema, and fixed a schema that failed its own valid tests under draft-07",
    prs: [6522, 6531],
  },
  {
    name: "pyOpenSci Python package guide",
    repo: "pyOpenSci/python-package-guide",
    what: "updated the tutorials for project URL labels and PEP 735 dependency groups, and fixed a version pin that does not exist",
    prs: [823, 824, 827],
  },
  {
    name: "NLeSC Python template",
    repo: "NLeSC/python-template",
    what: "trimmed the keywords a new package gets and dropped empty ones, and made tox run the generated package's tests",
    prs: [715, 716],
  },
  {
    name: "fastapi-mail",
    repo: "sabuhish/fastapi-mail",
    what: "improved Redis connection handling and let it reuse an existing connection",
    prs: [283, 284],
  },
  {
    name: "cspell-dicts",
    repo: "streetsidesoftware/cspell-dicts",
    what: "added the notebook file type and new technical terms",
    prs: [5339, 5364],
  },
  {
    name: "sentier_data_tools",
    repo: "sentier-dev/sentier_data_tools",
    what: "improved IRI handling",
    prs: [2],
  },
];

/**
 * A project's PRs in its own order, grouped by the branch they were merged into. The default
 * branch comes first with `base` unset. A PR merged into another branch (say `dev`) gets the
 * branch named, since that work is not on the default branch yet. A PR missing from the
 * snapshot counts as the default branch until the next refresh.
 */
export function prGroups(project: UpstreamProject, prs = merged.prs): { base?: string; prs: number[] }[] {
  const groups = new Map<string | undefined, number[]>([[undefined, []]]);
  for (const number of project.prs) {
    const pr = prs.find((p) => p.repo.toLowerCase() === project.repo.toLowerCase() && p.number === number);
    const base = pr && pr.base !== pr.default_branch ? pr.base : undefined;
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base)?.push(number);
  }
  return [...groups].filter(([, numbers]) => numbers.length).map(([base, numbers]) => ({ base, prs: numbers }));
}
