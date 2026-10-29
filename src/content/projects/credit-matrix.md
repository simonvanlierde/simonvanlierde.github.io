---
title: credit-matrix
description: "Co-authors fill in who did what on a paper with the CRediT roles and export it as JATS4R XML. A Python tool beside it reads the roles from open-access papers. On {held_out} papers it never trained on, a small fine-tuned model scored higher than my rule-based parser and a large language model given no examples."
repo: https://github.com/simonvanlierde/credit-matrix
demo: https://credit.duinlab.nl
kind: web app
tags:
  - TypeScript
  - Next.js 16
  - Python
  - DuckDB
  - machine learning
links:
  - label: Zenodo record
    url: https://doi.org/10.5281/zenodo.21213659
  - label: CRediT census
    url: https://github.com/simonvanlierde/credit-matrix/blob/main/census/README.md
order: 3
figures:
  held_out:
    value: "27,874"
    source: https://github.com/simonvanlierde/credit-matrix/blob/main/census/README.md
    as_of: "2026-10-27"
---
