import { useId, useState } from "preact/hooks";
import "./DisassemblyChart.css";
import data from "../data/stats.json" with { type: "json" };
import { buildScale, formatCount, runningTotals, stepPaths } from "./chartScale";

// Pre-aggregated figures from the ReLab /stats endpoint, baked in at build time
// (see scripts/fetch-stats.mjs). Shape mirrors that endpoint's response.
type SeriesRow = {
  period: string;
  label: string;
  teardowns: number;
  parts: number;
  mass_kg: number;
  images: number;
  users: number;
};

type MeasureKey = "teardowns" | "parts" | "mass_kg" | "images" | "users";

const stats = data as { series: SeriesRow[]; totals: Record<MeasureKey, number> };

// Formatters shared by the chart axis, tooltip, and table: the notes' thin-space
// thousands, so one figure never prints two ways on the sheet.
const int = formatCount;
const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 }).replace(/,/g, "\u2009");
const kg = (n: number) => `${num(n)} kg`;

// The switchable time-series measures. Adding one takes a single entry here plus
// the matching field in the /stats payload, and no other code changes.
// `fractional` marks measures that aren't whole counts, so the axis allows
// fractional steps. `format` carries the unit (tooltip, table); `tick` omits it,
// because a unit repeated down every gridline is noise. `unit` prints it once,
// atop the axis.
type Measure = {
  key: MeasureKey;
  label: string;
  noun: string;
  format: (n: number) => string;
  tick?: (n: number) => string;
  unit?: string;
  fractional?: boolean;
};
// Labels use the notes' own words, so "Products" here is note A there.
const MEASURES: Measure[] = [
  { key: "teardowns", label: "Products", noun: "products documented", format: int },
  { key: "parts", label: "Components", noun: "components catalogued", format: int },
  {
    key: "mass_kg",
    label: "Mass",
    noun: "product mass taken apart",
    format: kg,
    tick: num,
    unit: "kg",
    fractional: true,
  },
  { key: "images", label: "Images", noun: "images captured", format: int },
  // `users` counts platform sign-ups, not lab staff; the label says so.
  { key: "users", label: "Accounts", noun: "platform accounts", format: int },
];
const MEASURE_KEYS = MEASURES.map((m) => m.key);

// Running totals, not monthly bars: teardowns come in workshop campaigns, and
// monthly bars made every quiet month read as the platform stopping. Drawn as a
// hatched step, not bars: a bar per month reads as that month's amount, where a
// stepped outline reads as one quantity building up.
const rows = runningTotals(stats.series, MEASURE_KEYS, stats.totals, "teardowns");
const PRIMARY_MEASURE_KEYS: MeasureKey[] = ["teardowns", "parts", "mass_kg"];
const primaryMeasures = MEASURES.filter((measure) => PRIMARY_MEASURE_KEYS.includes(measure.key));
const secondaryMeasures = MEASURES.filter((measure) => !PRIMARY_MEASURE_KEYS.includes(measure.key));

// Split "Jul 2025" into a tick ("Jul") and a qualifier ("2025") that only prints
// when it changes. Purely textual, so "Q1 2025" and a bare "2025" pass through
// unharmed.
const splitLabel = (label: string): [string, string] => {
  const i = label.indexOf(" ");
  return i === -1 ? [label, ""] : [label.slice(0, i), label.slice(i + 1)];
};

// SVG coordinate system. The SVG scales fluidly via viewBox, so every user unit
// here is also a type size: at 720 wide the chart rendered at 0.66 in its column
// and 12px axis labels came out at 8 real pixels. 480 keeps the widest case near
// 1:1; narrow screens trade the y-axis away instead (see the CSS).
const W = 480;
const H = 240;
const PAD = { top: 20, right: 12, bottom: 40, left: 48 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

export default function DisassemblyChart({
  caption,
}: {
  /** Figure caption, set under the plot in the set's caption style. The
      chart appends the period it covers, so the caption dates itself. */
  caption?: string;
}) {
  const [measureKey, setMeasureKey] = useState<MeasureKey>("teardowns");
  const [active, setActive] = useState<number | null>(null);
  const [showAllMeasures, setShowAllMeasures] = useState(false);
  const legendId = useId();
  const secondaryControlsId = useId();
  const hatchId = useId();

  const measure = MEASURES.find((m) => m.key === measureKey) ?? MEASURES[0];

  const series = rows.map((row) => ({
    period: row.period,
    label: row.label,
    added: Number(row[measure.key]) || 0,
    value: row.total[measure.key],
  }));

  const maxValue = Math.max(1, ...series.map((d) => d.value));
  const { yMax, ticks } = buildScale(maxValue, !measure.fractional);

  // All hooks have run; bail out with a graceful empty state when there are no
  // periods to plot (e.g. a fresh dataset or an empty time window).
  if (series.length === 0) {
    return (
      <figure className="chart">
        <p className="chart__empty">No disassembly data available yet.</p>
      </figure>
    );
  }

  const first = series[0];
  const last = series[series.length - 1];
  const x = (i: number) => PAD.left + (i + 0.5) * (INNER_W / series.length);
  const y = (v: number) => PAD.top + INNER_H - (v / yMax) * INNER_H;
  const colW = INNER_W / series.length;
  const baseline = PAD.top + INNER_H;
  const tick = measure.tick ?? measure.format;

  // A narrow plot has room for about six month labels. Count the stride back
  // from the latest month, so the newest period always keeps its label, and
  // put the year on the labelled months where it changes, so a narrow plot
  // never prints two unqualified runs of "Jun Jul Aug".
  const stride = Math.ceil(series.length / 6);
  const isMajor = (i: number) => (series.length - 1 - i) % stride === 0;
  let lastMajorYear = "";

  const outline = stepPaths(
    series.map((d) => y(d.value)),
    PAD.left,
    colW,
    baseline,
  );

  const summary =
    `Running total of ${measure.noun} in ReLab: ${measure.format(first.value)} by ${first.label}, ` +
    `${measure.format(last.value)} by ${last.label}. Monthly figures are in the table below.`;

  const secondaryMeasureActive = secondaryMeasures.some((m) => m.key === measure.key);
  const measureButton = (m: Measure) => (
    <button
      type="button"
      className="chart__toggle"
      key={m.key}
      aria-pressed={measure.key === m.key}
      onClick={() => setMeasureKey(m.key)}
    >
      {m.label}
    </button>
  );

  return (
    <figure className="chart">
      {/* No running-total tiles here: the ReLab row's general notes carry
          them, from the same payload. The chart answers "when". */}

      <fieldset className="chart__controls">
        <legend className="visually-hidden">Measure</legend>
        <div className="chart__controls-row chart__controls-row--primary">
          {primaryMeasures.map(measureButton)}
          <button
            type="button"
            className="chart__more"
            aria-expanded={showAllMeasures}
            aria-controls={secondaryControlsId}
            // The visible word leads each name (WCAG 2.5.3), so "click Fewer"
            // works for a voice-control user.
            aria-label={
              !showAllMeasures && secondaryMeasureActive
                ? `${measure.label} selected. Show more measures`
                : showAllMeasures
                  ? "Show fewer measures"
                  : "Show more measures"
            }
            data-secondary-active={!showAllMeasures && secondaryMeasureActive}
            onClick={() => setShowAllMeasures((shown) => !shown)}
          >
            {!showAllMeasures && secondaryMeasureActive && (
              <span className="chart__more-current">{measure.label} selected</span>
            )}
            <span>{showAllMeasures ? "Fewer" : "More"}</span>
          </button>
        </div>
        <div
          className="chart__controls-row chart__controls-row--secondary"
          id={secondaryControlsId}
          hidden={!showAllMeasures}
        >
          {secondaryMeasures.map(measureButton)}
        </div>
      </fieldset>

      <div className="chart__plot">
        {/* A screen reader gets the data table below. A sighted keyboard user
            gets neither that nor hover, so the plot is one tab stop and the
            arrow keys walk the same tooltip across the columns. One stop, not
            one per column: role="img" makes the children presentational. */}
        {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: the handlers are the keyboard affordance described above */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label={summary}
          preserveAspectRatio="xMidYMid meet"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: the tab stop is the fix, not an oversight
          tabIndex={0}
          onFocus={(e) => {
            // A click focuses the plot as well. Only a keyboard focus should
            // move the tooltip, or clicking near the axis jerks it to column 1.
            if (e.currentTarget.matches(":focus-visible")) setActive((i) => i ?? 0);
          }}
          onBlur={() => setActive(null)}
          onKeyDown={(e) => {
            const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
            if (step) {
              setActive((i) => Math.min(series.length - 1, Math.max(0, (i ?? 0) + step)));
            } else if (e.key === "Home") {
              setActive(0);
            } else if (e.key === "End") {
              setActive(series.length - 1);
            } else {
              return;
            }
            // Otherwise the arrows scroll the page out from under the chart.
            e.preventDefault();
          }}
          onPointerLeave={(e) => {
            // A touch pointer fires pointerleave on finger lift; the tooltip
            // would flash and vanish. Only a mouse leaving clears it; a tap
            // elsewhere replaces it.
            if (e.pointerType === "mouse") setActive(null);
          }}
        >
          {/* Gridlines and y-axis labels */}
          <g className="chart__grid">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                  {tick(t)}
                </text>
              </g>
            ))}
          </g>

          {/* The unit, once, rather than repeated down every gridline */}
          {measure.unit && (
            <text className="chart__unit" x={PAD.left - 8} y={PAD.top - 10} textAnchor="end">
              {measure.unit}
            </text>
          )}

          {/* Section hatching, the drafting convention for a filled region:
              solid lines, so its contrast is the line colour's, not a blend. */}
          <defs>
            <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line className="chart__hatch" x1="0" y1="0" x2="0" y2="6" />
            </pattern>
          </defs>

          {/* The running total: a hatched region under a stepped outline, drawn
              in left to right on load. */}
          <g className="chart__total">
            <path className="chart__area" d={outline.area} fill={`url(#${hatchId})`} />
            <path className="chart__line" d={outline.line} />
          </g>

          {/* Zero baseline: the total stands on it, so it outweighs the gridlines */}
          <line className="chart__axis" x1={PAD.left} x2={W - PAD.right} y1={baseline} y2={baseline} />

          {/* x-axis labels + hover targets */}
          {series.map((d, i) => {
            const [head, tail] = splitLabel(d.label);
            const major = isMajor(i);
            const showTail = major && tail !== "" && tail !== lastMajorYear;
            if (major) lastMajorYear = tail;
            return (
              <g key={d.period}>
                <text
                  className={major ? "chart__xlabel" : "chart__xlabel chart__xlabel--minor"}
                  x={x(i)}
                  y={H - PAD.bottom + 18}
                  textAnchor="middle"
                >
                  {head}
                  {showTail && (
                    <tspan className="chart__xlabel-qualifier" x={x(i)} dy="1.15em">
                      {tail}
                    </tspan>
                  )}
                </text>
                {/* Transparent hover target spanning the column. Pointer events, not
                    mouse events, so a tap on a touch screen also reveals the tooltip. */}
                <rect
                  className="chart__hit"
                  x={PAD.left + i * colW}
                  y={PAD.top}
                  width={colW}
                  height={INNER_H}
                  onPointerEnter={() => setActive(i)}
                />
              </g>
            );
          })}

          {/* The latest total, lettered at the end of its step: the figure a reader wants, and
              the one the narrow plot would otherwise hide with its y-axis. */}
          <text className="chart__endlabel" x={x(series.length - 1)} y={y(last.value) - 8} textAnchor="middle">
            {tick(last.value)}
          </text>

          {/* Tooltip (mouse-driven enhancement; data is in the table below) */}
          {active !== null &&
            (() => {
              const d = series[active];
              const v = d.value;
              const cx = x(active);
              const cy = y(v);
              const tipX = Math.min(Math.max(cx, PAD.left + 64), W - PAD.right - 64);
              const tipY = Math.max(cy - 16, PAD.top + 12);
              return (
                <g className="chart__tooltip">
                  <line x1={cx} x2={cx} y1={PAD.top} y2={PAD.top + INNER_H} />
                  <circle cx={cx} cy={cy} r="4" />
                  <g transform={`translate(${tipX}, ${tipY})`}>
                    <rect x="-64" y="-26" width="128" height="34" />
                    <text x="0" y="-12" textAnchor="middle" className="chart__tip-title">
                      {d.label}
                    </text>
                    <text x="0" y="2" textAnchor="middle" className="chart__tip-value">
                      {measure.format(v)} (+{measure.format(d.added)})
                    </text>
                  </g>
                </g>
              );
            })()}
        </svg>
      </div>

      {/* Pressing a measure button rewrites the chart, its aria-label and the
          table below, none of which announces itself. The button reports its own
          pressed state; this reports what the data now says. */}
      <p className="visually-hidden" aria-live="polite">
        {`${measure.label}: ${measure.format(last.value)} by ${last.label}.`}
      </p>

      {/* Accessible data table (visually hidden, read by assistive tech) */}
      <table className="visually-hidden" aria-labelledby={legendId}>
        <caption id={legendId}>{measure.label}, running total by month</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Added</th>
            <th scope="col">Running total</th>
          </tr>
        </thead>
        <tbody>
          {series.map((d) => (
            <tr key={d.period}>
              <th scope="row">{d.label}</th>
              <td>{measure.format(d.added)}</td>
              <td>{measure.format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {caption && (
        <figcaption>
          {caption}, {first.label} to {last.label}.
        </figcaption>
      )}
    </figure>
  );
}
