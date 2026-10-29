---
title: 6-second-scribbles
description: "A real-time multiplayer drawing and guessing game, with a Vue 3 front end and a FastAPI back end that talk over WebSockets. In a load test, one back-end container with one CPU holds about {rooms} rooms of {players} players, and {share} of messages arrive within {latency} ms."
repo: https://github.com/simonvanlierde/6-second-scribbles
demo: https://6ss.duinlab.nl
kind: multiplayer game
tags:
  - Vue 3
  - FastAPI
  - WebSockets
links:
  - label: Load test
    url: https://github.com/simonvanlierde/6-second-scribbles/blob/main/docs/capacity.md
category: personal
uses:
  - jsonvet
order: 1
figures:
  rooms:
    value: "200"
    source: https://github.com/simonvanlierde/6-second-scribbles/blob/main/docs/capacity.md
    as_of: "2026-10-21"
  players:
    value: "6"
    source: https://github.com/simonvanlierde/6-second-scribbles/blob/main/docs/capacity.md
    as_of: "2026-10-21"
  share:
    value: "95%"
    source: https://github.com/simonvanlierde/6-second-scribbles/blob/main/docs/capacity.md
    as_of: "2026-10-21"
  latency:
    value: "250"
    source: https://github.com/simonvanlierde/6-second-scribbles/blob/main/docs/capacity.md
    as_of: "2026-10-21"
---
