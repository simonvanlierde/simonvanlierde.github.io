---
title: Hub-and-spoke observability for a research institute
description: How the shared monitoring for CML's research software is split into one central hub and a small agent per project, and why silence is the failure it is built around.
date: "2026-11-09"
---
A backup container once crash-looped 668 times over 19 hours while every monitor read green. None of them counted restarts, so as far as they could tell nothing had happened. The failures that hurt are the ones nothing is watching for.

That incident shaped the monitoring I built and run for the research software at CML, the Institute of Environmental Sciences at Leiden University. The full design is [ADR 0002](https://github.com/CMLPlatform/monitoring/blob/main/docs/adr/0002-hub-and-spoke-observability.md) in the [monitoring repository](https://github.com/CMLPlatform/monitoring). This note is the short version.

## The setup

I had one part-time operator (me), no budget, Docker Compose on every server, and projects at very different stages. So the stack has three parts.

- **Spokes:** each project's server runs a small collector, Grafana Alloy. It sends the server's logs and resource use to the hub. The applications send their own traces and request metrics through OpenTelemetry, the open standard for instrumenting code. The collector's config is one shared file. A project sets a few environment variables and never edits it.
- **Hub:** one central server that takes everything in at a single address with a single token. Senders never see the storage behind it (Loki for logs, Tempo for traces, Prometheus for metrics). All alert rules live in Grafana, and they can read the logs as well as the numbers. The most useful alerts need that.
- **Outside checks:** healthchecks.io for scheduled jobs, and a probe from outside the network that checks the public sites are up. Everything else alerts when it sees a problem. These two alert when they hear nothing.

## Silence is the failure

A service can't report that it has stopped reporting. So the hub has one alert per project and environment, `ProjectTelemetrySilent`, that fires about 20 minutes after a sender goes quiet. A project gets it automatically when it joins. On 2026-08-27 it fired on a real outage of a project server, and cleared when the server came back.

The backup container would now trip a second alert, which fires when any container restarts more than three times in an hour.

## Rules that keep it small

- Every signal is labelled with the same `project`, `env` and `service.name`. The collector also adds `host_name` to what it gathers. The hub stamps `department` itself, so a sender can't claim to be another department.
- Each kind of signal has one producer: the collector gathers container logs and server metrics, the applications send traces and request metrics, and healthchecks.io records whether a job ran.
- Joining means copying, not building. A new project copies the template files at a pinned version and sets a few variables. One command on the hub then adds its alerts:

  ```sh
  ./bootstrap.sh <project> <env>
  ```

## What I left out, and what would change that

Grafana Cloud's free tier would have removed the hub entirely. I turned it down for data protection, not cost. Container logs can quote research and personal data in database error lines, and sending those to a US-operated service is a GDPR problem that a server run by the department doesn't have.

I also left out a separate token per project, and walls between projects' logs. With one operator they protect against nothing yet. The first leaked token is the trigger for per-project tokens, and the first dataset other projects mustn't see is the trigger for the walls. Each is about a day of work, not a redesign.

## Who reports to it

Today that is R9lab, CML's platform for recording what products are made of, in production and staging. The CML Gallery is planned. No other project sends data yet, and the repository's [README](https://github.com/CMLPlatform/monitoring#who-reports-here) keeps that list current.

## Scale and limits

Each project server adds about 1,400 metric series. The hub holds about 7,000 with one server reporting and warns at 30,000, which leaves room for about 18 servers.

Prometheus accepts OpenTelemetry metrics on a path its own docs reserve for low volumes. The ADR names when to revisit that: a server with more than a few thousand distinct metric series.
