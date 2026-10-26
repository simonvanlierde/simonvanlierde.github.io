---
title: ramascene-explorer
description: "A map of where a country's consumption causes greenhouse-gas emissions, jobs and metal-ore extraction, split by {sections} industry sections. It reads {runs} precomputed RaMa-Scene runs on EXIOBASE {base_year}: a baseline, three interventions and {scenarios} material-efficiency scenarios. The browser fetches only the parts of a {parquet_size} MB Parquet file it needs, under 1 MB on first load. Every number comes from a checked engine run, and none of it is a forecast."
repo: https://github.com/simonvanlierde/ramascene-explorer
demo: https://simonvanlierde.github.io/ramascene-explorer/
kind: interactive map
tags:
  - Svelte
  - D3
  - Parquet
  - EXIOBASE
links:
  - label: Zenodo record
    url: https://doi.org/10.5281/zenodo.23461260
order: 4
figures:
  sections:
    value: "15"
    source: https://github.com/simonvanlierde/ramascene-explorer
    as_of: "2026-10-14"
  runs:
    value: "153"
    source: https://github.com/simonvanlierde/ramascene-explorer/blob/main/docs/precompute.md#the-shipped-run
    as_of: "2026-10-14"
  base_year:
    value: "2011"
    source: https://github.com/simonvanlierde/ramascene-explorer
    as_of: "2026-10-14"
  scenarios:
    value: "150"
    source: https://github.com/simonvanlierde/ramascene-explorer
    as_of: "2026-10-14"
  parquet_size:
    value: "51.5"
    source: https://github.com/simonvanlierde/ramascene-explorer/releases/tag/data-2011
    as_of: "2026-10-14"
---
