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
    what: "fixed normalized and weighted scores that went stale after a new impact assessment, and a cutoff that broke on negative scores",
    prs: [167, 168],
  },
  {
    name: "pymrio",
    repo: "IndEcol/pymrio",
    what: "sped up calc_accounts and set_dom_block, fixed three small bugs, and got the development test job passing again",
    prs: [179, 180, 181],
  },
  {
    name: "flodym",
    repo: "pik-piam/flodym",
    what: "stopped lifetime extension from overwriting the model's parameters, and made it about 9× faster",
    prs: [198],
  },
  {
    name: "lca_algebraic",
    repo: "oie-mines-paristech/lca_algebraic",
    what: "fixed truncated-normal and lognormal sampling and method lookup, and halved the time to expand parameters",
    prs: [106, 107, 108],
  },
  {
    name: "Activity Browser",
    repo: "LCA-ActivityBrowser/activity-browser",
    what: "kept parameter amounts editable, loaded scenario files with empty keys, and kept a Monte Carlo seed of 0",
    prs: [1743, 1744],
  },
  {
    name: "pyOpenSci Python package guide",
    repo: "pyOpenSci/python-package-guide",
    what: "updated the tutorials for project URL labels and PEP 735 dependency groups",
    prs: [823, 824],
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
