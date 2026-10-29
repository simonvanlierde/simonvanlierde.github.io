---
title: ramascene-explorer
description: "A map of where a country's consumption causes greenhouse-gas emissions, jobs and metal-ore extraction, split by {sections} industry sections, over a baseline and {runs} precomputed RaMa-Scene scenarios on EXIOBASE {base_year}. The browser fetches only the parts of a {parquet_size} MB Parquet file it needs, about {first_load} MB on first load. A separate check scores one product in Brightway, pymrio, pycirk and numpy, and all of them give the engine's footprint. None of it is a forecast."
repo: https://github.com/simonvanlierde/ramascene-explorer
demo: https://simonvanlierde.com/ramascene-explorer/
kind: interactive map
tags:
  - Svelte
  - D3
  - Parquet
  - EXIOBASE
links:
  - label: Zenodo record
    url: https://doi.org/10.5281/zenodo.23461260
  - label: Brightway check
    url: https://github.com/simonvanlierde/ramascene-explorer/blob/main/brightway-check/README.md
order: 4
figures:
  sections:
    value: "15"
    source: https://github.com/simonvanlierde/ramascene-explorer/blob/main/docs/precompute.md#embodied-flows
    as_of: "2026-10-14"
  runs:
    value: "153"
    source: https://github.com/simonvanlierde/ramascene-explorer/blob/main/docs/precompute.md#the-shipped-run
    as_of: "2026-10-14"
  base_year:
    value: "2011"
    source: https://github.com/simonvanlierde/ramascene-explorer
    as_of: "2026-10-14"
  parquet_size:
    value: "51.5"
    source: https://github.com/simonvanlierde/ramascene-explorer/blob/main/docs/precompute.md#embodied-flows
    as_of: "2026-10-14"
  first_load:
    value: "0.98"
    source: https://github.com/simonvanlierde/ramascene-explorer/blob/main/docs/page.md#first-load-size
    as_of: "2026-10-26"
---
