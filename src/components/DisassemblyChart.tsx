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

// Axis, tooltip, and table share the notes' thin-space thousands.
const int = formatCount;
const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 }).replace(/,/g, "\u2009");
const kg = (n: number) => `${num(n)} kg`;

// Switchable measures. A new one needs only an entry here and the matching
// /stats field. `format` carries the unit; `tick` omits it, and `unit` prints
// it once above the axis.
type Measure = {
  key: MeasureKey;
  label: string;
  noun: string;
  format: (n: number) => string;
  tick?: (n: number) => string;
  unit?: string;
  fractional?: boolean;
};
// Labels match the notes' wording: "Products" is note A.
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

// Running totals as a step, not monthly bars. Teardowns come in workshop
// campaigns, so monthly bars made quiet months look like the platform stopped.
const rows = runningTotals(stats.series, MEASURE_KEYS, stats.totals, "teardowns");
const PRIMARY_MEASURE_KEYS: MeasureKey[] = ["teardowns", "parts", "mass_kg"];
const primaryMeasures = MEASURES.filter((measure) => PRIMARY_MEASURE_KEYS.includes(measure.key));
const secondaryMeasures = MEASURES.filter((measure) => !PRIMARY_MEASURE_KEYS.includes(measure.key));

// "Jul 2025" -> ["Jul", "2025"]. A label with no space passes through whole.
const splitLabel = (label: string): [string, string] => {
  const i = label.indexOf(" ");
  return i === -1 ? [label, ""] : [label.slice(0, i), label.slice(i + 1)];
};

// viewBox size. The SVG scales to its column, so user units set the type size.
// 480 renders near 1:1 at full width; 720 shrank 12px labels to 8px. The CSS
// handles narrow plots.
const W = 480;
const H = 240;
const PAD = { top: 20, right: 12, bottom: 40, left: 48 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

export default function DisassemblyChart({
  caption,
}: {
  /** Figure caption. The chart appends the period it covers. */
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

  // Empty state. Keep this return below every hook call.
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

  // A narrow plot fits about six month labels. Count the stride back from the
  // latest month, so that month is always labelled. Labelled months show the
  // year where it changes.
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
      {/* No total tiles: the ReLab notes show the totals from the same data. */}

      <fieldset className="chart__controls">
        <legend className="visually-hidden">Measure</legend>
        <div className="chart__controls-row chart__controls-row--primary">
          {primaryMeasures.map(measureButton)}
          <button
            type="button"
            className="chart__more"
            aria-expanded={showAllMeasures}
            aria-controls={secondaryControlsId}
            // Each name contains the visible word (WCAG 2.5.3), so a
            // voice-control user can say "click Fewer".
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
        {/* Keyboard users get one tab stop, and arrow keys move the tooltip
            between columns. Not one stop per column: role="img" makes the
            children presentational. Screen readers use the data table. */}
        {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: the handlers are the keyboard affordance described above */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label={summary}
          preserveAspectRatio="xMidYMid meet"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: the plot's single tab stop, see above
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
            // Touch fires pointerleave on finger lift, which would hide the
            // tooltip at once. Only a mouse leaving clears it.
            if (e.pointerType === "mouse") setActive(null);
          }}
        >
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

          {measure.unit && (
            <text className="chart__unit" x={PAD.left - 8} y={PAD.top - 10} textAnchor="end">
              {measure.unit}
            </text>
          )}

          <defs>
            <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line className="chart__hatch" x1="0" y1="0" x2="0" y2="6" />
            </pattern>
          </defs>

          <g className="chart__total">
            <path className="chart__area" d={outline.area} fill={`url(#${hatchId})`} />
            <path className="chart__line" d={outline.line} />
          </g>

          <line className="chart__axis" x1={PAD.left} x2={W - PAD.right} y1={baseline} y2={baseline} />

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
                {/* Column hover target. Pointer events, so a tap also shows the tooltip. */}
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

          {/* Latest total. The only magnitude label when a narrow plot hides the y-axis. */}
          <text className="chart__endlabel" x={x(series.length - 1)} y={y(last.value) - 8} textAnchor="middle">
            {tick(last.value)}
          </text>

          {/* Tooltip: an enhancement only, the table holds the same data */}
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

      {/* Announces the new figure when a measure button redraws the chart. */}
      <p className="visually-hidden" aria-live="polite">
        {`${measure.label}: ${measure.format(last.value)} by ${last.label}.`}
      </p>

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
