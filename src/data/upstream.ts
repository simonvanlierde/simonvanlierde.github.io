// Keep repository-level evidence intact when grouping the six showcase entries.
// The snapshot records merge branches; the drift check requires each PR here or in leftOut.
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
  "typst/packages#6284",
];

export interface UpstreamProject {
  name: string;
  repo: string;
  /** Results in prose. In a showcase group, one project brackets its strongest result. */
  what: string;
  prs: number[];
}

export const upstream: UpstreamProject[] = [
  {
    name: "lca_algebraic",
    repo: "oie-mines-paristech/lca_algebraic",
    what: "fixed truncated-normal and lognormal sampling, method lookup and a cache that went stale across time zones; sped up parameter expansion, and [cut the Sobol analysis step from 3.13 s to 0.16 s in a 20-parameter benchmark] when second-order indices are not needed",
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
    what: "[made extension calculations about 4× faster on EXIOBASE-sized tables] with the same results, fixed three small bugs, and got the development test job passing again",
    prs: [179, 180, 181],
  },
  {
    name: "Brightway (stats_arrays)",
    repo: "brightway-lca/stats_arrays",
    what: "stopped loading scipy.stats at import, which makes importing bw2calc and bw2data about 0.3 s faster",
    prs: [43],
  },
  {
    name: "flodym",
    repo: "pik-piam/flodym",
    what: "[made lifetime extension about 9× faster], and stopped it overwriting the model's parameters",
    prs: [198],
  },
  {
    name: "bw_timex",
    repo: "brightway-lca/bw_timex",
    what: "[made building the time-explicit matrices 3 to 4× faster], with identical matrices and scores",
    prs: [244],
  },
  {
    name: "premise",
    repo: "polca/premise",
    what: "[fixed two bugs in how external scenarios apply efficiency changes], one of which scaled flows they were meant to leave alone",
    prs: [316, 317],
  },
  {
    name: "Activity Browser",
    repo: "LCA-ActivityBrowser/activity-browser",
    what: "[kept parameter amounts editable], loaded scenario files with empty keys, and kept a Monte Carlo seed of 0",
    prs: [1743, 1744],
  },
  {
    name: "SALib",
    repo: "SALib/SALib",
    what: "let ProblemSpec take samples and results as plain lists, kept a random seed of 0, and added tests for the sampling and analysis command-line tools",
    prs: [700, 706, 713],
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
    what: "fixed a missing use-phase impact factor and accepted zero-valued bounds for impact criteria that returned 'not implemented'",
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
    what: "trimmed the keywords a new package gets and dropped empty ones, made tox run the generated package's tests, and fixed tests for quotes in package descriptions",
    prs: [715, 716, 718],
  },
  {
    name: "latex-credits",
    repo: "Pseudomanifold/latex-credits",
    what: "kept escaped characters in author names from breaking compilation or changing the printed name, and prepared the package for CTAN with a manual and an upload bundle",
    prs: [13, 14],
  },
  {
    name: "reauth",
    repo: "frankie567/reauth",
    what: "turned a malformed OAuth2 ID token into the library's own token-exchange error instead of a raw PyJWT one",
    prs: [34],
  },
  {
    name: "openLCA Python client",
    repo: "GreenDelta/olca-ipc.py",
    what: "fixed deletion of data quality systems, and JSON-RPC error handling that crashed get_all and lost a failed simulation's error",
    prs: [48, 49],
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

export const upstreamShowcase = [
  {
    name: "Brightway",
    projects: [
      "brightway-lca/brightway2-calc",
      "brightway-lca/brightway2-data",
      "brightway-lca/stats_arrays",
      "brightway-lca/bw_timex",
    ],
  },
  { name: "Activity Browser", projects: ["LCA-ActivityBrowser/activity-browser"] },
  { name: "premise", projects: ["polca/premise"] },
  { name: "pymrio", projects: ["IndEcol/pymrio"] },
  { name: "lca_algebraic", projects: ["oie-mines-paristech/lca_algebraic"] },
  { name: "flodym", projects: ["pik-piam/flodym"] },
].map((group) => {
  const projects = group.projects.map((repo) => {
    const project = upstream.find((entry) => entry.repo === repo);
    if (!project) throw new Error(`Missing upstream evidence for ${repo}`);
    return project;
  });
  const leads = projects.flatMap((project) => {
    const text = project.what.match(/\[(.+?)\]/)?.[1];
    return text ? [{ project, text }] : [];
  });
  if (leads.length !== 1) throw new Error(`${group.name} needs one [strongest result], has ${leads.length}`);
  return { name: group.name, projects, lead: leads[0] };
});

/** `what` as printed, without the bracket that marks the strongest result. */
export const plainWhat = (project: UpstreamProject) => project.what.replace(/[[\]]/g, "");

export const alsoMerged = upstream.filter(
  (project) => !upstreamShowcase.some((group) => group.projects.includes(project)),
);

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
