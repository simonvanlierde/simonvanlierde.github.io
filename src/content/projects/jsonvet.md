---
title: jsonvet
description: "I rewrote check-json5, a Python tool that checks JSON files for errors, in Rust. It now checks a large JSON5 file {speedup} times faster, and at release it agreed with the Python version in all {runs} side-by-side runs. It reads {dialects} JSON dialects and is on PyPI and crates.io."
repo: https://github.com/simonvanlierde/jsonvet
demo: https://simonvanlierde.com/jsonvet/
kind: JSON linter
tags:
  - Rust
  - pre-commit
  - PyPI
  - fuzzing
links:
  - label: Zenodo record
    url: https://doi.org/10.5281/zenodo.23461825
  - label: Speed figures
    url: https://github.com/simonvanlierde/jsonvet/blob/main/docs/design.md#speed
uses:
  - citesync
featured: true
order: 1
figures:
  dialects:
    value: "six"
    source: https://github.com/simonvanlierde/jsonvet#jsonvet
    as_of: "2026-10-28"
  runs:
    value: "40,228"
    source: https://github.com/simonvanlierde/jsonvet/pull/34
    as_of: "2026-10-13"
  speedup:
    value: "1,395"
    source: https://github.com/simonvanlierde/jsonvet/blob/main/docs/design.md#speed
    as_of: "2026-10-28"
---
