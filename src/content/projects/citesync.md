---
title: citesync
description: "Generate CITATION.cff, codemeta.json and .zenodo.json from a citation file or package metadata in the browser playground. The CLI and pre-commit hook keep them in sync using CodeMeta's crosswalks, as exported by codemeta-drift."
repo: https://github.com/simonvanlierde/citesync
demo: https://simonvanlierde.com/citesync/
kind: citation metadata
tags:
  - Python
  - PyPI
  - CodeMeta
  - CITATION.cff
tooling:
  - project-templates
order: 9
layer: software
threads:
  - open-and-fair-research-software
builds_on:
  - codemeta-drift
serves:
  - builders
could_serve:
  - researchers
---
