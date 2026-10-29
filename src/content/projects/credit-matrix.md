---
title: credit-matrix
description: "Write CRediT contribution statements (who did what on a paper) with your co-authors in your browser, and export them as JATS4R XML or a heatmap. A Python pipeline beside it reads the roles from open-access papers; its fine-tuned encoder scores F1 {f1} on {held_out} held-out articles."
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
