// Prints the drift issue's sections for src/data/upstream.json, cardImages.json and codemeta.json (see evidenceDrift
// and staleEntries in evidence.mjs).
// Reads only committed files, so it needs no network. scripts/check-drift.sh runs it.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { leftOut, upstream } from "../src/data/upstream.ts";
import { evidenceDrift, staleEntries } from "./evidence.mjs";

const data = async (name) => JSON.parse(await readFile(resolve(import.meta.dirname, "../src/data", name), "utf8"));
const up = await data("upstream.json");
const today = new Date().toISOString().slice(0, 10);

process.stdout.write(
  evidenceDrift({
    curated: upstream,
    leftOut,
    merged: up.prs,
    fetchedAt: up.fetched_at,
    today,
  }) +
    staleEntries("src/data/cardImages.json", await data("cardImages.json"), today) +
    staleEntries("src/data/codemeta.json", await data("codemeta.json"), today),
);
