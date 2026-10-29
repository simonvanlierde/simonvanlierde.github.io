---
title: credit-matrix
description: "Write a CRediT statement (who did what on a paper) together with your co-authors in the browser, and export it as journal XML (JATS4R) or a heatmap. Beside it, a Python tool reads the roles from open-access papers. Its trained model scores {f1} out of one at naming each author's roles, on {held_out} papers it never saw in training."
repo: https://github.com/simonvanlierde/credit-matrix
demo: https://credit.duinlab.nl
kind: web app
tags:
  - TypeScript
  - Next.js 16
  - Python
  - DuckDB
links:
  - label: Zenodo record
    url: https://doi.org/10.5281/zenodo.21213659
  - label: CRediT census
    url: https://github.com/simonvanlierde/credit-matrix/blob/main/census/README.md
order: 3
figures:
  f1:
    value: "0.899"
    source: https://github.com/simonvanlierde/credit-matrix/blob/main/census/README.md
    as_of: "2026-10-27"
  held_out:
    value: "27,874"
    source: https://github.com/simonvanlierde/credit-matrix/blob/main/census/README.md
    as_of: "2026-10-27"
---
