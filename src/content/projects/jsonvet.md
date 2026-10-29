---
title: jsonvet
description: "A checker for {dialects} kinds of JSON, from strict JSON to JSON5, that reports syntax errors, duplicate keys and data that breaks the file's rules, by line and column. I rewrote it in Rust from Python and publish it on PyPI and crates.io. It matched the Python version in all {runs} side-by-side comparisons and checks a large JSON5 file {speedup} times faster."
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
