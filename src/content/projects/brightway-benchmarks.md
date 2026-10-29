---
title: brightway-benchmarks
description: "This suite caught Brightway's LCA calculator, bw2calc 3.0.0, running its iterative solver about {slowdown} times slower when the optional PyPardiso solver is missing. I reported it, and the maintainer's fix shipped in 3.1.0. It tracks speed across Brightway releases and checks each score against an independent calculation, on made-up databases shaped like ecoinvent."
repo: https://github.com/simonvanlierde/brightway-benchmarks
kind: benchmark suite
tags:
  - Python
  - Brightway
  - LCA
  - asv
  - Docker
links:
  - label: Benchmark history
    url: https://simonvanlierde.com/brightway-benchmarks/
  - label: Zenodo record
    url: https://doi.org/10.5281/zenodo.23727602
order: 2
figures:
  slowdown:
    value: "five"
    source: https://github.com/simonvanlierde/brightway-benchmarks#results-so-far
    as_of: "2026-10-29"
---
