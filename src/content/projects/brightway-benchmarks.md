---
title: brightway-benchmarks
description: "Measures how fast each release of the Brightway LCA framework runs everyday calculations, and checks every result against an independent calculation. It runs on made-up databases built like ecoinvent, so anyone can rerun it. It caught bw_timex 1.3.0 taking about {timex} times longer to build the time-explicit inventory."
repo: https://github.com/simonvanlierde/brightway-benchmarks
kind: benchmark suite
tags:
  - Python
  - Brightway
  - asv
  - Docker
links:
  - label: Benchmark history
    url: https://simonvanlierde.com/brightway-benchmarks/
  - label: Zenodo record
    url: https://doi.org/10.5281/zenodo.23727602
order: 2
figures:
  timex:
    value: "19"
    source: https://github.com/simonvanlierde/brightway-benchmarks#the-other-packages
    as_of: "2026-10-28"
---
