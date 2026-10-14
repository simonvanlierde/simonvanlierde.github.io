// Merged pull requests in other people's projects, newest project first.
// shortcut: kept by hand from a GitHub search (author:simonvanlierde is:pr is:merged
// -user:simonvanlierde -org:CMLPlatform); generate it if the list outgrows a monthly edit.
export interface UpstreamProject {
  name: string;
  repo: string;
  what: string;
  prs: number[];
}

export const upstream: UpstreamProject[] = [
  {
    name: "Brightway (bw2calc)",
    repo: "brightway-lca/brightway2-calc",
    what: "stale normalized and weighted scores after a new LCIA; fraction cutoff with negative scores",
    prs: [167, 168],
  },
  {
    name: "pymrio",
    repo: "IndEcol/pymrio",
    what: "faster calc_accounts and set_dom_block; three small bugs; the development test job",
    prs: [179, 180, 181],
  },
  {
    name: "flodym",
    repo: "pik-piam/flodym",
    what: "lifetime extension no longer overwrites the model's parameters, and runs about 9× faster",
    prs: [198],
  },
  {
    name: "lca_algebraic",
    repo: "oie-mines-paristech/lca_algebraic",
    what: "truncated-normal and lognormal sampling, method lookup, and halved parameter expansion time",
    prs: [106, 107, 108],
  },
  {
    name: "Activity Browser",
    repo: "LCA-ActivityBrowser/activity-browser",
    what: "editable parameter amounts, scenario files with empty keys, a Monte Carlo seed of 0",
    prs: [1743, 1744],
  },
  {
    name: "pyOpenSci Python package guide",
    repo: "pyOpenSci/python-package-guide",
    what: "project URL labels and PEP 735 dependency groups in the tutorials",
    prs: [823, 824],
  },
  {
    name: "fastapi-mail",
    repo: "sabuhish/fastapi-mail",
    what: "Redis connection handling and reuse",
    prs: [283, 284],
  },
  {
    name: "cspell-dicts",
    repo: "streetsidesoftware/cspell-dicts",
    what: "notebook file type and technical terms",
    prs: [5339, 5364],
  },
  {
    name: "sentier_data_tools",
    repo: "sentier-dev/sentier_data_tools",
    what: "IRI handling",
    prs: [2],
  },
];
