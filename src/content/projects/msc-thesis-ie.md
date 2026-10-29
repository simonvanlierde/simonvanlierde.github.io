---
title: msc-thesis-ie
description: "My MSc Industrial Ecology thesis (Leiden / TU Delft), rebuilt as a Snakemake pipeline. It works out the cooling need of {buildings} buildings in The Hague and its life-cycle impact, from the Dutch building register (BAG), an hourly heat-balance model and LCA. Offices have {office_area} of the floor area but cause {office_ghg} of the cooling emissions."
repo: https://github.com/simonvanlierde/msc-thesis-ie
demo: https://simonvanlierde.com/msc-thesis-ie
kind: thesis + dashboard
tags:
  - Python
  - Snakemake
  - LCA
  - Geospatial
links:
  - label: Thesis manuscript
    url: https://repository.tudelft.nl/record/uuid:32222863-536f-464a-b8c6-6c2283a7249a
  - label: Zenodo dataset
    url: https://doi.org/10.5281/zenodo.8344580
order: 10
figures:
  buildings:
    value: "59,381"
    source: https://github.com/simonvanlierde/msc-thesis-ie/blob/main/dashboard/README.md
    as_of: "2026-10-28"
  office_area:
    value: "11%"
    source: https://github.com/simonvanlierde/msc-thesis-ie#key-findings
    as_of: "2026-10-28"
  office_ghg:
    value: "79%"
    source: https://github.com/simonvanlierde/msc-thesis-ie#key-findings
    as_of: "2026-10-28"
---
