import { useId, useState } from "react";
import "./DisassemblyChart.css";
import fallback from "../data/stats.json";

// Pre-aggregated figures from the RELab /stats endpoint, baked in at build time
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
const kg = (n: number) => `${n.toLocaleString("en", { maximumFractionDigits: 1 })} kg`;

// The switchable time-series measures. Adding one is a single entry here plus
// the matching field in the /stats payload — no other code changes. `fractional`
// marks measures that aren't whole counts, so the axis allows fractional steps.
type Measure = {
  key: MeasureKey;
  label: string;
  noun: string;
  format: (n: number) => string;
  fractional?: boolean;
};
const MEASURES: Measure[] = [
  { key: "teardowns", label: "Teardowns", noun: "products disassembled", format: int },
  { key: "parts", label: "Parts", noun: "components extracted", format: int },
  { key: "mass_kg", label: "Mass", noun: "reverse-engineered", format: kg, fractional: true },
  { key: "images", label: "Images", noun: "photos catalogued", format: int },
  { key: "users", label: "Signups", noun: "new lab members", format: int },
];

// SVG coordinate system. The SVG scales fluidly via viewBox.
const W = 720;
const H = 260;
const PAD = { top: 24, right: 16, bottom: 40, left: 56 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

// Build an axis with a "nice" round step (1/2/5 × 10ⁿ) so tick labels are
// evenly spaced and never collide after formatting. For whole-count measures
// the step is forced to an integer, so e.g. a max of 2 gives ticks 0,1,2
// rather than 0,0.5,1,1.5,2 (which round to a duplicated "0,1,1,2,2").
function buildScale(max: number, integer: boolean): { yMax: number; ticks: number[] } {
  const targetSteps = 4;
  const rawStep = max / targetSteps || 1;
  const mag = 10 ** Math.floor(Math.log10(rawStep));
  const norm = rawStep / mag;
  let step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  if (integer) step = Math.max(1, Math.round(step));
  const yMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= yMax + step / 1000; t += step) ticks.push(t);
  return { yMax, ticks };
}

export default function DisassemblyChart({
  stats = fallback as StatsPayload,
  isSample = false,
}: {
  stats?: StatsPayload;
  isSample?: boolean;
}) {
  const [measureKey, setMeasureKey] = useState<MeasureKey>("teardowns");
  const [active, setActive] = useState<number | null>(null);
  const legendId = useId();

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

  const summary =
    `Chart of ${measure.label.toLowerCase()} in the Reverse Engineering Lab (${measure.noun}): ` +
    `${measure.format(total)} across ${series.length} ${periodNoun}s, from ${series[0]?.label} to ` +
    `${series[series.length - 1]?.label}. Full figures are in the table below.` +
    (isSample ? " Sample data." : "");

  return (
    <figure className="chart">
      <div className="chart__toolbar">
        <fieldset className="chart__controls">
          <legend className="visually-hidden">Measure</legend>
          {MEASURES.map((m) => (
            <button
              type="button"
              className="chart__toggle"
              key={m.key}
              aria-pressed={measure.key === m.key}
              onClick={() => setMeasureKey(m.key)}
            >
              {m.label}
            </button>
          ))}
        </fieldset>
      </div>

      <div className="chart__plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label={summary}
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setActive(null)}
        >
          {/* Gridlines and y-axis labels */}
          <g className="chart__grid">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                  {measure.format(t)}
                </text>
              </g>
            ))}
          </g>

          {/* Bars + x-axis labels + hover targets */}
          {series.map((d, i) => (
            <g key={d.period}>
              <rect
                className="chart__bar"
                x={x(i) - barWidth / 2}
                y={y(d.value)}
                width={barWidth}
                height={PAD.top + INNER_H - y(d.value)}
                rx="2"
                data-active={active === i}
              />
              {/* x-axis labels: show every other to avoid crowding */}
              {i % 2 === 0 && (
                <text className="chart__xlabel" x={x(i)} y={H - PAD.bottom + 18} textAnchor="middle">
                  {d.label}
                </text>
              )}
              {/* Transparent hover target spanning the column (mouse enhancement) */}
              {/* biome-ignore lint/a11y/noStaticElementInteractions: pointer-only tooltip affordance; the same figures are in the accessible table below */}
              <rect
                className="chart__hit"
                x={PAD.left + i * colW}
                y={PAD.top}
                width={colW}
                height={INNER_H}
                onMouseEnter={() => setActive(i)}
              />
            </g>
          ))}

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
                    <rect x="-58" y="-26" width="116" height="34" rx="6" />
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
    </figure>
  );
}
