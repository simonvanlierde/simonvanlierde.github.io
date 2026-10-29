---
title: citesync
description: "A repo's citation metadata sits in several files: CITATION.cff, codemeta.json, .zenodo.json and the package manifest. citesync checks that they agree on title, version, authors, licence, DOI and the rest, and rewrites them to match one source file. Where each field sits in each format comes from CodeMeta's crosswalks, as exported by codemeta-drift. It runs as a pre-commit hook and is on PyPI with a Zenodo DOI."
repo: https://github.com/simonvanlierde/citesync
kind: pre-commit hook
tags:
  - Python
  - PyPI
  - CodeMeta
  - CITATION.cff
links:
  - label: Zenodo record
    url: https://doi.org/10.5281/zenodo.23779706
uses:
  - codemeta-drift
  - project-templates
order: 9
---
