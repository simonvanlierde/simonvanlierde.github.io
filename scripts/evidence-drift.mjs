// Prints the drift issue's section for src/data/upstream.json (see evidenceDrift in evidence.mjs).
// Reads only committed files, so it needs no network. scripts/check-drift.sh runs it.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { leftOut, upstream } from "../src/data/upstream.ts";
import { evidenceDrift } from "./evidence.mjs";

const up = JSON.parse(await readFile(resolve(import.meta.dirname, "../src/data/upstream.json"), "utf8"));

process.stdout.write(
  evidenceDrift({
    curated: upstream,
    leftOut,
    merged: up.prs,
    fetchedAt: up.fetched_at,
    today: new Date().toISOString().slice(0, 10),
  }),
);
