import React, { useMemo } from "react";

function weekKey(dateLike) {
  const date = new Date(`${dateLike}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

function formatWeekLabel(key) {
  const d = new Date(`${key}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function LineChart({ data, color = "#B8FF00" }) {
  const width = 520;
  const height = 180;
  const max = Math.max(1, ...data.values);
  const points = data.values
    .map((v, i) => {
      const x = (i / Math.max(1, data.values.length - 1)) * (width - 20) + 10;
      const y = height - (v / max) * (height - 30) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="180" role="img" aria-label="progress line chart">
      <line x1="8" y1={height - 10} x2={width - 8} y2={height - 10} stroke="rgba(255,255,255,0.18)" />
      <polyline fill="none" stroke={color} strokeWidth="3" points={points} />
      {data.values.map((v, i) => {
        const x = (i / Math.max(1, data.values.length - 1)) * (width - 20) + 10;
        const y = height - (v / max) * (height - 30) - 10;
        return <circle key={`${v}-${i}`} cx={x} cy={y} r="3" fill={color} />;
      })}
    </svg>
  );
}

function BarChart({ data, color = "#00E5FF" }) {
  const width = 520;
  const height = 180;
  const max = Math.max(1, ...data.values);
  const barWidth = Math.max(10, (width - 20) / Math.max(1, data.values.length) - 8);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="180" role="img" aria-label="progress bar chart">
      <line x1="8" y1={height - 10} x2={width - 8} y2={height - 10} stroke="rgba(255,255,255,0.18)" />
      {data.values.map((v, i) => {
        const x = 10 + i * ((width - 20) / Math.max(1, data.values.length)) + 4;
        const barHeight = (v / max) * (height - 30);
        return (
          <rect
            key={`${v}-${i}`}
            x={x}
            y={height - 10 - barHeight}
            width={barWidth}
            height={barHeight}
            fill={color}
            opacity="0.65"
            rx="4"
          />
        );
      })}
    </svg>
  );
}

export default function ProgressCharts({ scores = [], shotLogs = [], userEmail }) {
  const weeklyData = useMemo(() => {
    const makeMap = new Map();
    const activeDays = new Map();

    shotLogs.filter((row) => row.email === userEmail).forEach((row) => {
      const key = weekKey(row.date);
      if (!key) return;
      makeMap.set(key, (makeMap.get(key) || 0) + (row.made || 0));
    });

    scores.filter((row) => row.email === userEmail).forEach((row) => {
      const key = weekKey(row.date);
      if (!key) return;
      const dates = activeDays.get(key) || new Set();
      dates.add(row.date);
      activeDays.set(key, dates);
    });

    const keys = Array.from(new Set([...makeMap.keys(), ...activeDays.keys()])).sort();
    return {
      labels: keys.map(formatWeekLabel),
      makes: keys.map((k) => makeMap.get(k) || 0),
      streak: keys.map((k) => (activeDays.get(k)?.size || 0)),
    };
  }, [scores, shotLogs, userEmail]);

  if (!weeklyData.labels.length) return null;

  return (
    <section style={{ marginBottom: 18 }}>
      <div style={{ color: "#E5E7EB", fontSize: 12, letterSpacing: "0.08em", marginBottom: 10 }}>PROGRESS OVER TIME</div>
      <div style={{ background: "var(--surface-card)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "var(--shadow-1)", borderRadius: 12, padding: 12, marginBottom: 10 }}>
        <div style={{ color: "#B2BBC7", fontSize: 12, marginBottom: 8 }}>Shot makes per week</div>
        <LineChart data={{ labels: weeklyData.labels, values: weeklyData.makes }} />
      </div>
      <div style={{ background: "var(--surface-elevated)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "var(--shadow-2)", borderRadius: 12, padding: 12 }}>
        <div style={{ color: "#B2BBC7", fontSize: 12, marginBottom: 8 }}>Active streak days per week</div>
        <BarChart data={{ labels: weeklyData.labels, values: weeklyData.streak }} />
      </div>
    </section>
  );
}
