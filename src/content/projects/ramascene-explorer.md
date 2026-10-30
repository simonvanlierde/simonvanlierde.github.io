---
title: ramascene-explorer
description: "Pick a country and see where in the world its consumption causes greenhouse-gas emissions, jobs and metal-ore extraction, and how {runs} RaMa-Scene scenarios would have changed that in EXIOBASE's {base_year} economy. The page runs without a server and fetches about {first_load} MB to start. Brightway, pymrio and numpy give the same footprint for a test product."
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
uses:
  - jsonvet
  - citesync
featured: true
image_focus: { x: 0.62, y: 1, zoom: 2.3 }
order: 4
figures:
  runs:
    value: "153"
    source: https://github.com/simonvanlierde/ramascene-explorer/blob/main/docs/precompute.md#the-shipped-run
    as_of: "2026-10-14"
  base_year:
    value: "2011"
    source: https://github.com/simonvanlierde/ramascene-explorer
    as_of: "2026-10-14"
  first_load:
    value: "0.98"
    source: https://github.com/simonvanlierde/ramascene-explorer/blob/main/docs/page.md#first-load-size
    as_of: "2026-10-26"
---
