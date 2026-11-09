---
title: Homelab as code
description: How my home lab runs from one Git repository, with an Ansible host layer, Compose stacks, deploy checks and written decision records.
date: "2026-11-09"
---
My deploy script refuses to touch a Docker host whose checkout has a hand edit. That one rule shapes most of how I run my home lab.

The stacks, the host setup and the reasons behind both live in one Git repository. It is private, so this note has no links into it and no names from the network. It describes the shape and the trade-offs.

## The setup

- **Stacks:** 23 Compose stacks on three Docker hosts, one directory per host. Each host holds a checkout of the repo. Git is the only writer of that checkout.
- **Host layer:** Ansible, in two plays. The first covers every managed host: users, sshd, shell profile, apt and journald. The second covers the Docker hosts. Running it with `--check --diff` is my drift report. Scheduled jobs are systemd timers, not cron. Cron skips a job whose minute passes while the host is down, and a timer with `Persistent=` runs it at boot.
- **Deploy:** one script. It pulls fast-forward only, force-recreates the stacks whose files changed, dumps a database before an image upgrade can migrate it, then requests every route on the host. Only a pass moves the "verified" marker, so a failed range is retried by the next run. There is no rollback. I revert the commit and deploy again.
- **Checks:** 23 commit hooks. Compose files are checked on the host that owns them, against its real env file, so my own machine installs nothing. The Caddy config is validated inside the container that serves it. Hand-written addresses are compared with the inventory. CI runs the hooks that need no host.
- **Decision records:** 28 so far. Each has a decision, a reason, what I rejected and when to revisit. A record earns its place when someone competent would look at the config, think "that's odd" and fix it.

## Why the host layer exists

My hand-kept host table had already gone wrong twice: a host ran without its checkout, and an agent sat on the `latest` tag. A play with `--check --diff` turns that kind of drift into a diff.

Image pins follow the same idea. I pin by what a bad image can do. Anything with the Docker socket or `NET_ADMIN`, and any database whose upgrade rewrites its data in place, is pinned by digest. Ordinary apps get a version tag. Only stateless tools use `latest`. A script enforces the first group. Pinning everything by digest would mean a Renovate pull request per image per week for one person.

## What I rejected

- **A control plane such as Komodo or Dockhand.** A tool that edits hosts directly turns the repo into a description of what used to be true. Each one also adds a privileged agent per host. They would have to retire more parts than they add before I switch.
- **A compose UI.** I ran Dockge and dropped it. It could not update itself, because it runs `docker compose up` from inside the container it is replacing.
- **The Ansible `cron` module.** It tracks jobs by a marker comment and would have duplicated every line I had placed by hand.

## Limits

- About half the lab is not in the repo. Several machines keep their config on the box. For those I export read-only state into the repo and read the diff. That shows a bad click afterwards. It does not prevent one.
- Secrets still sit in env files on the hosts. Encrypting them in Git is decided and not built.
- Four of the hooks need a live host, so CI skips them and only my machine runs them.
- One person runs all of this. The checks assume it, and the records say to revisit them when a second person commits.
