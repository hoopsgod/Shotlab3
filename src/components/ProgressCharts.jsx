import React, { useEffect, useMemo, useState } from "react";
import UI_TOKENS from "../styles/tokens";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";

const FILTERS = [
  { id: "week", label: "Week", days: 7 },
  { id: "month", label: "Month", days: 30 },
];

const HELP_COPY = {
  PR: "PR = Personal Record. Your best single logged score for that drill.",
  Avg: "Avg = Your average score in the selected time filter.",
  Logs: "Logs = Number of score entries you logged in the selected time filter.",
};

function startOfDay(dateLike) {
  const date = new Date(`${dateLike}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatShortDate(date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function buildDailyBuckets(days) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    buckets.push({ key: d.toISOString().slice(0, 10), label: formatShortDate(d) });
  }
  return buckets;
}

function calcTrend(values) {
  if (values.length < 4) return { direction: "stable", delta: 0 };
  const mid = Math.floor(values.length / 2);
  const first = values.slice(0, mid);
  const second = values.slice(mid);
  const firstAvg = first.reduce((a, v) => a + v, 0) / Math.max(1, first.length);
  const secondAvg = second.reduce((a, v) => a + v, 0) / Math.max(1, second.length);
  const delta = secondAvg - firstAvg;
  if (delta > 0.4) return { direction: "up", delta };
  if (delta < -0.4) return { direction: "down", delta };
  return { direction: "stable", delta };
}

function LineChart({ data, yAxisLabel, color = UI_TOKENS.colors.action.primary }) {
  const width = 540;
  const height = 200;
  const leftPad = 44;
  const rightPad = 12;
  const topPad = 12;
  const bottomPad = 28;
  const max = Math.max(1, ...data.values);

  const points = data.values
    .map((v, i) => {
      const x = leftPad + (i / Math.max(1, data.values.length - 1)) * (width - leftPad - rightPad);
      const y = height - bottomPad - (v / max) * (height - topPad - bottomPad);
      return `${x},${y}`;
    })
    .join(" ");

  const yTicks = [0, Math.round(max / 2), max];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="200" role="img" aria-label={`${yAxisLabel} line chart`}>
      <text x="14" y={height / 2} fill={UI_TOKENS.colors.textMuted} fontSize="9" transform={`rotate(-90,14,${height / 2})`} style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {yAxisLabel}
      </text>
      {yTicks.map((tick) => {
        const y = height - bottomPad - (tick / max) * (height - topPad - bottomPad);
        return (
          <g key={tick}>
            <line x1={leftPad} y1={y} x2={width - rightPad} y2={y} stroke="rgba(199,210,226,0.2)" />
            <text x={leftPad - 6} y={y + 3} textAnchor="end" fill={UI_TOKENS.colors.textMuted} fontSize="9">{tick}</text>
          </g>
        );
      })}
      <polyline fill="none" stroke={color} strokeWidth="2.4" points={points} />
      {data.values.map((v, i) => {
        const x = leftPad + (i / Math.max(1, data.values.length - 1)) * (width - leftPad - rightPad);
        const y = height - bottomPad - (v / max) * (height - topPad - bottomPad);
        const isEdge = i === 0 || i === data.values.length - 1;
        return (
          <g key={`${v}-${i}`}>
            <circle cx={x} cy={y} r="3" fill={color} />
            {isEdge ? <text x={x} y={height - 8} fill={UI_TOKENS.colors.textMuted} fontSize="9" textAnchor={i === 0 ? "start" : "end"}>{data.labels[i]}</text> : null}
          </g>
        );
      })}
    </svg>
  );
}

export default function ProgressCharts({ scores = [], userEmail, drills = [], errorMessage, onRetry }) {
  const [range, setRange] = useState("week");
  const [showHelp, setShowHelp] = useState(false);
  const activeFilter = FILTERS.find((f) => f.id === range) || FILTERS[0];
  const [chartsLoading, setChartsLoading] = useState(true);

  useEffect(() => {
    setChartsLoading(true);
    const timeoutId = window.setTimeout(() => setChartsLoading(false), 450);
    return () => window.clearTimeout(timeoutId);
  }, [range, scores.length, drills.length]);

  const drillLookup = useMemo(() => {
    const map = new Map();
    drills.forEach((drill) => map.set(drill.id, drill));
    return map;
  }, [drills]);

  const progress = useMemo(() => {
    const buckets = buildDailyBuckets(activeFilter.days);
    const bucketSet = new Set(buckets.map((b) => b.key));
    const byDrill = new Map();

    scores.forEach((row) => {
      const date = startOfDay(row.date);
      if (!date) return;
      const key = date.toISOString().slice(0, 10);
      if (!bucketSet.has(key)) return;
      if (!byDrill.has(row.drillId)) byDrill.set(row.drillId, { mine: [], team: [] });
      const bin = byDrill.get(row.drillId);
      if (row.email === userEmail) bin.mine.push({ ...row, key });
      bin.team.push({ ...row, key });
    });

    const drillRows = Array.from(byDrill.entries())
      .map(([drillId, rows]) => {
        if (!rows.mine.length) return null;

        const personalByDate = new Map();
        rows.mine.forEach((item) => {
          const values = personalByDate.get(item.key) || [];
          values.push(item.score || 0);
          personalByDate.set(item.key, values);
        });

        const dailyAverages = buckets.map((bucket) => {
          const vals = personalByDate.get(bucket.key) || [];
          if (!vals.length) return 0;
          return Math.round((vals.reduce((a, v) => a + v, 0) / vals.length) * 10) / 10;
        });

        const personalBest = rows.mine.reduce((max, item) => Math.max(max, item.score || 0), 0);
        const myAvg = rows.mine.length ? Math.round((rows.mine.reduce((a, item) => a + (item.score || 0), 0) / rows.mine.length) * 10) / 10 : 0;
        const teamAvg = rows.team.length ? Math.round((rows.team.reduce((a, item) => a + (item.score || 0), 0) / rows.team.length) * 10) / 10 : 0;

        return {
          drillId,
          name: drillLookup.get(drillId)?.name || `Drill ${drillId}`,
          logs: rows.mine.length,
          personalBest,
          myAvg,
          teamAvg,
          yAxisLabel: "makes per session",
          labels: buckets.map((b) => b.label),
          values: dailyAverages,
          trend: calcTrend(dailyAverages.filter((v) => v > 0)),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.logs - a.logs);

    const recommendations = drillRows
      .filter((drill) => drill.trend.direction === "down")
      .slice(0, 3)
      .map((drill) => `Your ${drill.name.toLowerCase()} is declining; revisit the fundamentals drill this week.`);

    return { drillRows, recommendations };
  }, [activeFilter.days, scores, userEmail, drillLookup]);

  if (errorMessage) return <ErrorState title="Progress charts unavailable" description={errorMessage} onRetry={onRetry} className="progressChartsState" />;
  if (chartsLoading) return <LoadingState variant="chart" title="Building charts" description="Crunching your latest drill history and trend metrics." className="progressChartsState" />;
  if (!progress.drillRows.length) return null;

  return (
    <section className="progressChartSection">
      <div className="progressChartHeader">
        <div className="progressChartKicker">Progress Over Time</div>
        <div className="progressChartActions">
          {FILTERS.map((filter) => (
            <button key={filter.id} type="button" onClick={() => setRange(filter.id)} className={`btn btn--ghost progressChartFilter ${filter.id === range ? "is-active" : ""}`.trim()}>
              {filter.label}
            </button>
          ))}
          <button type="button" onClick={() => setShowHelp(true)} className="btn btn--ghost progressChartHelpBtn">Metric Help</button>
        </div>
      </div>

      {progress.drillRows.map((drill) => (
        <div key={drill.drillId} className="shared-card progressChartCard">
          <div className="progressChartHeader">
            <div>
              <div className="progressChartKicker" style={{ fontSize: "0.82rem", letterSpacing: "0.02em", textTransform: "none" }}>{drill.name}</div>
              <div className="progressChartSubtitle">Daily average in selected {range}</div>
            </div>
            <div className="progressChartMeta">
              <span title={HELP_COPY.PR}>PR {drill.personalBest}</span>
              <span title={HELP_COPY.Avg}>Avg {drill.myAvg}</span>
              <span title={HELP_COPY.Logs}>Logs {drill.logs}</span>
              <span style={{ color: "var(--color-action-secondary)" }}>Team Avg {drill.teamAvg}</span>
            </div>
          </div>
          <LineChart data={{ labels: drill.labels, values: drill.values }} yAxisLabel={drill.yAxisLabel} />
        </div>
      ))}

      {progress.recommendations.length > 0 ? (
        <div className="shared-card progressChartCard" style={{ borderColor: "rgba(179, 144, 98, 0.55)" }}>
          <div className="progressChartRecommendationsTitle">Personalized Recommendations</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-2)", fontSize: "var(--fs-helper)", lineHeight: 1.5 }}>
            {progress.recommendations.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ) : null}

      {showHelp ? (
        <div role="dialog" aria-modal="true" onClick={() => setShowHelp(false)} className="progressChartModal">
          <div onClick={(event) => event.stopPropagation()} className="shared-card progressChartDialog">
            <div className="progressChartKicker" style={{ fontSize: "0.94rem", textTransform: "none", letterSpacing: "0.01em", marginBottom: "var(--space-2)" }}>Metrics Guide</div>
            <ul style={{ margin: 0, paddingLeft: 16, color: "var(--text-2)", fontSize: "var(--fs-helper)", lineHeight: 1.6 }}>
              <li>{HELP_COPY.PR}</li>
              <li>{HELP_COPY.Avg}</li>
              <li>{HELP_COPY.Logs}</li>
            </ul>
            <button type="button" onClick={() => setShowHelp(false)} className="btn btn--ghost progressChartCloseBtn" style={{ marginTop: "var(--space-3)" }}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
