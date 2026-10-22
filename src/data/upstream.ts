// Merged pull requests in other people's projects, most telling first: wrong
// results and measured speed-ups in LCA and industrial-ecology libraries lead,
// tooling and docs follow.
// shortcut: kept by hand from a GitHub search (author:simonvanlierde is:pr is:merged
// -user:simonvanlierde -org:CMLPlatform); generate it if the list outgrows a monthly edit.
// Left out on purpose: list entries for my own projects or employers (awesome-PhD #51,
// awesome-sustainability-jobs #21).
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
    name: "premise",
    repo: "polca/premise",
    what: "kept every efficiency variable's exclusions in external scenarios, and made market efficiency filters behave like production pathways",
    prs: [316, 317],
  },
  {
    name: "Activity Browser",
    repo: "LCA-ActivityBrowser/activity-browser",
    what: "kept parameter amounts editable, loaded scenario files with empty keys, and kept a Monte Carlo seed of 0",
    prs: [1743, 1744],
  },
  {
    name: "Brightway (bw2data)",
    repo: "brightway-lca/brightway2-data",
    what: "moved to a deepdiff release without two security advisories, keeping the project revision format readable",
    prs: [295],
  },
  {
    name: "Boavizta API",
    repo: "Boavizta/boaviztapi",
    what: "returned use-phase values for six impact criteria that answered 'not implemented'",
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
