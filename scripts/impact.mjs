// Run records from a repository's impact.jsonl (run record schema v0): one JSON object per line.

const methodKinds = new Set(["measured", "modelled", "estimated"]);
const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const isText = (value) => typeof value === "string" && value.trim() !== "";
const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

/** Why a measure breaks the schema's required fields, or undefined when it holds. */
function measureProblem(slug, measure) {
  if (!isObject(measure)) return `${slug} is not an object`;
  if (!isNumber(measure.value) || !isText(measure.unit)) return `${slug} needs a numeric value and a unit`;
  const { method, uncertainty } = measure;
  if (!isObject(method) || !methodKinds.has(method.kind) || !isText(method.tool) || !isText(method.version))
    return `${slug} needs a method with kind, tool and version`;
  if (!isObject(uncertainty)) return `${slug} has no uncertainty`;
  const { low, high, interval, distribution, unknown } = uncertainty;
  if (low !== undefined || high !== undefined) {
    if (!isNumber(low) || !isNumber(high) || low > high || !isText(interval))
      return `${slug} needs a numeric low <= high and an interval`;
    if (unknown !== undefined) return `${slug} cannot have both bounds and unknown`;
  } else if (!isObject(distribution) && unknown !== true) {
    return `${slug} needs low and high, a distribution, or unknown: true`;
  }
}

/** Why a record breaks the schema's required fields, or undefined when it holds. */
export function recordProblem(record) {
  if (!isObject(record)) return "not a JSON object";
  if (record.schema_version !== "0") return `unsupported schema_version ${JSON.stringify(record.schema_version)}`;
  const { run, measures } = record;
  if (!isObject(run) || !isText(run.kind) || !isText(run.name) || Number.isNaN(Date.parse(run.start_time)))
    return "run needs a name, a kind and a start_time";
  if (!isObject(measures) || Object.keys(measures).length === 0) return "no measures";
  for (const [slug, measure] of Object.entries(measures)) {
    const problem = measureProblem(slug, measure);
    if (problem) return problem;
  }
}

/**
 * The latest valid record per run.kind, by start_time (a tie goes to the later line).
 * Each invalid line is passed to `warn` and skipped.
 * @param {string} text
 * @param {(problem: string) => void} [warn]
 * @returns {Record<string, import("../src/data/projectSchema.ts").RunRecord>}
 */
export function latestRecords(text, warn = () => undefined) {
  const latest = {};
  for (const [index, line] of text.split("\n").entries()) {
    if (line.trim() === "") continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      warn(`line ${index + 1}: not JSON`);
      continue;
    }
    const problem = recordProblem(record);
    if (problem) {
      warn(`line ${index + 1}: ${problem}`);
      continue;
    }
    const kept = latest[record.run.kind];
    if (!kept || Date.parse(record.run.start_time) >= Date.parse(kept.run.start_time)) latest[record.run.kind] = record;
  }
  return latest;
}
