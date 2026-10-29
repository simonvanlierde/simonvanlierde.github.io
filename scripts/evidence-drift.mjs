// Prints the drift issue's sections for the generated evidence files (see evidenceDrift in evidence.mjs).
// Reads only committed files, so it needs no network. scripts/check-drift.sh runs it.

import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { leftOut, upstream } from "../src/data/upstream.ts";
import { evidenceDrift } from "./evidence.mjs";

const root = resolve(import.meta.dirname, "..");
const json = async (file) => JSON.parse(await readFile(resolve(root, file), "utf8"));

const dir = resolve(root, "src/content/projects");
const sources = [
  "src/data/cv-public.yaml",
  "src/pages/index.astro",
  ...(await readdir(dir)).map((f) => `src/content/projects/${f}`),
];
const siteText = (await Promise.all(sources.map((f) => readFile(resolve(root, f), "utf8")))).join("\n");

const files = ["src/data/upstream.json", "src/data/dois.json", "src/data/openalex.json"];
const data = await Promise.all(files.map(json));
const [up, dois, openalex] = data;

process.stdout.write(
  evidenceDrift({
    curated: upstream,
    leftOut,
    merged: up.prs,
    dois: dois.records,
    works: openalex.works,
    siteText,
    fetchedAt: Object.fromEntries(files.map((f, i) => [f, data[i].fetched_at])),
    today: new Date().toISOString().slice(0, 10),
  }),
);
