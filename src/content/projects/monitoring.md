---
title: monitoring
description: "A backup container once crash-looped {restarts} times over {hours} hours while every monitor read green. So I redesigned CML's shared monitoring: now a scheduled job that stops checking in raises an alarm. Logs, traces and metrics come in through OpenTelemetry and link up in Grafana, and R9lab sends to it today."
repo: https://github.com/CMLPlatform/monitoring
kind: observability stack
tags:
  - OpenTelemetry
  - Grafana stack
  - Docker Compose
  - OpenTofu
order: 6
figures:
  restarts:
    value: "668"
    source: https://github.com/CMLPlatform/monitoring/blob/main/docs/adr/0002-hub-and-spoke-observability.md
    as_of: "2026-08-20"
  hours:
    value: "19"
    source: https://github.com/CMLPlatform/monitoring/blob/main/docs/adr/0002-hub-and-spoke-observability.md
    as_of: "2026-08-20"
---
