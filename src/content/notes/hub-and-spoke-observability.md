---
title: Hub-and-spoke observability for a research institute
description: How CML's shared monitoring stack is split into a central hub and a small agent per project, and why silence is the failure it is built around.
date: "2026-11-09"
---
A backup container once crash-looped 668 times over 19 hours while every monitor read green. Nothing was wrong with the monitors. They only knew how to report what a service told them, and this one had stopped talking.

That incident shaped the monitoring stack I run for CML research software. The design is written up as [ADR 0002](https://github.com/CMLPlatform/monitoring/blob/main/docs/adr/0002-hub-and-spoke-observability.md) in the [monitoring repository](https://github.com/CMLPlatform/monitoring). This note is the short version.

## The setup

The constraints were plain. One part-time operator, Docker Compose on every host, no budget, and projects at very different stages. So the stack has three tiers.

- **Spoke:** each project host runs one Grafana Alloy agent. It collects container logs, host metrics and container resource use. The application adds its own traces and metrics through the OpenTelemetry SDK. The agent config is one shared file that the monitoring repo publishes. A project sets environment variables and never edits it.
- **Hub:** the central host. It has one OTLP endpoint and one bearer token. Senders know nothing about Loki, Tempo or Prometheus behind it. Grafana holds all alert rules, so there is no separate Alertmanager. Grafana rules can query logs, and the most useful alerts need that.
- **Outside:** healthchecks.io for scheduled jobs, and an external prober for public reachability. These are the only detectors whose default state is alarm.

## Silence is the failure

A service cannot report that it has stopped reporting. So the hub carries one alert per project and environment, `ProjectTelemetrySilent`, that fires when a sender goes quiet. Bootstrapping a project creates it. On 2026-08-27 it fired on a real outage of a project host and cleared when the host came back.

## Rules that keep it small

- Every signal carries five identity labels: `project`, `env`, `service.name`, `host_name` and `department`. The agent config sets the first four. The hub stamps `department` itself, so a sender cannot claim another one.
- Each signal has one producer. Alloy owns container logs, the applications own request metrics, and healthchecks.io owns "did the job run".
- Joining is a copy. A project vendors the template files at a pinned tag, sets a few variables and runs `bootstrap.sh`.

## What I rejected

Grafana Cloud's free tier would have removed the hub entirely. I turned it down for data protection, not cost. Container logs can quote research and personal data in Postgres error lines, and sending those to a US-operated service is a policy problem a department-run host does not have.

## Who reports to it

Today that is R9lab, in production and staging. The CML Gallery is listed as planned. No other project sends data, and the repository's [README](https://github.com/CMLPlatform/monitoring#who-reports-here) keeps that list current.

## Limits

Prometheus takes OTLP metrics on a path its own docs call low-volume. The ADR sets the point to revisit: a host with more than a few thousand active series.
