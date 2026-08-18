import { type CSSProperties, useId, useState } from "react";
import "./DisassemblyChart.css";
import fallback from "../data/stats.json" with { type: "json" };
import { barPath, buildScale } from "./chartScale";

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

type StatsPayload = {
  granularity?: string;
  series: SeriesRow[];
};

type MeasureKey = "teardowns" | "parts" | "mass_kg" | "images" | "users";

// Formatters shared by the chart axis, tooltip, and table.
const int = (n: number) => Math.round(n).toLocaleString("en");
const num = (n: number) => n.toLocaleString("en", { maximumFractionDigits: 1 });
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
const MEASURES: Measure[] = [
  { key: "teardowns", label: "Teardowns", noun: "products disassembled", format: int },
  { key: "parts", label: "Parts", noun: "components extracted", format: int },
  {
    key: "mass_kg",
    label: "Mass",
    noun: "reverse-engineered",
    format: kg,
    tick: num,
    unit: "kg",
    fractional: true,
  },
  { key: "images", label: "Images", noun: "photos catalogued", format: int },
  { key: "users", label: "New members", noun: "new lab members", format: int },
];
const PRIMARY_MEASURE_KEYS: MeasureKey[] = ["teardowns", "parts", "mass_kg"];
const primaryMeasures = MEASURES.filter((measure) => PRIMARY_MEASURE_KEYS.includes(measure.key));
const secondaryMeasures = MEASURES.filter((measure) => !PRIMARY_MEASURE_KEYS.includes(measure.key));

// Split "Jul 2025" into a tick ("Jul") and a qualifier ("2025") that only prints
// when it changes. Every column keeps a label and none collide, so no
// every-other-column rule is needed: such a rule drops the most recent period
// without saying so. Purely textual, so "Q1 2025" and a bare "2025" pass through
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
  stats = fallback as StatsPayload,
  isSample = false,
  caption,
}: {
  stats?: StatsPayload;
  isSample?: boolean;
  /** Figure caption, set under the plot in the set's caption style. */
  caption?: string;
}) {
  const [measureKey, setMeasureKey] = useState<MeasureKey>("teardowns");
  const [active, setActive] = useState<number | null>(null);
  const [showAllMeasures, setShowAllMeasures] = useState(false);
  const legendId = useId();
  const secondaryControlsId = useId();

  const measure = MEASURES.find((m) => m.key === measureKey) ?? MEASURES[0];
  const periodNoun = stats.granularity ?? "month";

  const series = stats.series.map((row) => ({
    period: row.period,
    label: row.label,
    value: Number(row[measure.key]) || 0,
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

  const total = series.reduce((sum, d) => sum + d.value, 0);
  const x = (i: number) => PAD.left + (i + 0.5) * (INNER_W / series.length);
  const y = (v: number) => PAD.top + INNER_H - (v / yMax) * INNER_H;
  const colW = INNER_W / series.length;
  const barWidth = colW * 0.6;
  const baseline = PAD.top + INNER_H;
  const tick = measure.tick ?? measure.format;

  const summary =
    `Chart of ${measure.label.toLowerCase()} in ReLab (${measure.noun}): ` +
    `${measure.format(total)} across ${series.length} ${periodNoun}s, from ${series[0]?.label} to ` +
    `${series[series.length - 1]?.label}. Full figures are in the table below.` +
    (isSample ? " Sample data." : "");

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
      {isSample && <p className="chart__sample">Sample data for interface preview, not current ReLab activity.</p>}

      <fieldset className="chart__controls">
        <legend className="visually-hidden">Measure</legend>
        <div className="chart__controls-row chart__controls-row--primary">
          {primaryMeasures.map(measureButton)}
          <button
            type="button"
            className="chart__more"
            aria-expanded={showAllMeasures}
            aria-controls={secondaryControlsId}
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
            <span>{showAllMeasures ? "Less" : "More"}</span>
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
        {/* Pointer hover is a visual enhancement; keyboard/SR users get the data table */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label={summary}
          preserveAspectRatio="xMidYMid meet"
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

          {/* Zero baseline: the bars sit on it, so it outweighs the gridlines */}
          <line className="chart__axis" x1={PAD.left} x2={W - PAD.right} y1={baseline} y2={baseline} />

          {/* Bars + x-axis labels + hover targets */}
          {series.map((d, i) => {
            const [head, tail] = splitLabel(d.label);
            const showTail = tail !== "" && (i === 0 || tail !== splitLabel(series[i - 1].label)[1]);
            return (
              <g key={d.period}>
                <path
                  className="chart__bar"
                  d={barPath(x(i), barWidth, y(d.value), baseline)}
                  data-active={active === i}
                  style={{ "--bar-i": i } as CSSProperties}
                />
                <text className="chart__xlabel" x={x(i)} y={H - PAD.bottom + 18} textAnchor="middle">
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

          {/* Tooltip (mouse-driven enhancement; data is in the table below) */}
          {active !== null &&
            (() => {
              const d = series[active];
              const v = d.value;
              const cx = x(active);
              const cy = y(v);
              const tipX = Math.min(Math.max(cx, PAD.left + 58), W - PAD.right - 58);
              const tipY = Math.max(cy - 16, PAD.top + 12);
              return (
                <g className="chart__tooltip">
                  <line x1={cx} x2={cx} y1={PAD.top} y2={PAD.top + INNER_H} />
                  <circle cx={cx} cy={cy} r="4" />
                  <g transform={`translate(${tipX}, ${tipY})`}>
                    <rect x="-58" y="-26" width="116" height="34" />
                    <text x="0" y="-12" textAnchor="middle" className="chart__tip-title">
                      {d.label}
                    </text>
                    <text x="0" y="2" textAnchor="middle" className="chart__tip-value">
                      {measure.format(v)}
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
        {`${measure.label}: ${measure.format(total)} across ${series.length} ${periodNoun}s.`}
      </p>

      {/* Accessible data table (visually hidden, read by assistive tech) */}
      <table className="visually-hidden" aria-labelledby={legendId}>
        <caption id={legendId}>
          {measure.label} per {periodNoun}
          {isSample ? " (sample data)" : ""}
        </caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">{measure.label}</th>
          </tr>
        </thead>
        <tbody>
          {series.map((d) => (
            <tr key={d.period}>
              <th scope="row">{d.label}</th>
              <td>{measure.format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
