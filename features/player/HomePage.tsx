import type { CSSProperties } from "react";
import SHOTLAB_DEMO_FIXTURES from "../../src/demoFixtures";

const cardStyle: CSSProperties = {
  background: "var(--surface-2)",
  border: "1px solid var(--stroke-1)",
  borderRadius: "20px",
  padding: "20px",
  boxShadow: "var(--shadow-1)",
};

const metricValueStyle: CSSProperties = {
  fontSize: "2rem",
  fontWeight: 800,
  color: "var(--text-1)",
  lineHeight: 1,
};

export default function HomePage() {
  const player = SHOTLAB_DEMO_FIXTURES.player;
  const recentScores = SHOTLAB_DEMO_FIXTURES.progress.scores.slice(-3).reverse();
  const nextEvent = SHOTLAB_DEMO_FIXTURES.programEvents[0];
  const shotLogs = SHOTLAB_DEMO_FIXTURES.progress.shotLogs;
  const totalMakes = shotLogs.reduce((sum, log) => sum + log.made, 0);
  const bestScore = SHOTLAB_DEMO_FIXTURES.progress.scores.reduce(
    (best, entry) => Math.max(best, entry.score),
    0,
  );

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <section
        style={{
          ...cardStyle,
          background:
            "radial-gradient(circle at top left, rgba(200,255,26,0.18), transparent 35%), var(--surface-2)",
        }}
      >
        <div style={{ fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-2)", marginBottom: "12px" }}>
          Player Demo
        </div>
        <h1 style={{ fontSize: "2.4rem", lineHeight: 1.05, marginBottom: "10px", color: "var(--text-1)" }}>
          Welcome back, {player.name}
        </h1>
        <p style={{ color: "var(--text-2)", maxWidth: "56ch", fontSize: "1rem", lineHeight: 1.6 }}>
          The standalone player demo is loading again with seeded ShotLab data, including recent scores,
          upcoming program events, and training progress snapshots.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
        <div style={cardStyle}>
          <div style={{ color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.78rem", marginBottom: "10px" }}>Best Score</div>
          <div style={metricValueStyle}>{bestScore}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.78rem", marginBottom: "10px" }}>Shots Made</div>
          <div style={metricValueStyle}>{totalMakes}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.78rem", marginBottom: "10px" }}>Upcoming Event</div>
          <div style={{ ...metricValueStyle, fontSize: "1.4rem", lineHeight: 1.2 }}>{nextEvent.title}</div>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 1fr)", gap: "16px" }}>
        <div style={cardStyle}>
          <div style={{ color: "var(--text-1)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>Recent Progress</div>
          <div style={{ display: "grid", gap: "12px" }}>
            {recentScores.map((entry) => (
              <div
                key={`${entry.drillId}-${entry.ts}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  background: "var(--surface-1)",
                  border: "1px solid var(--stroke-1)",
                }}
              >
                <div>
                  <div style={{ color: "var(--text-1)", fontWeight: 700, marginBottom: "4px" }}>{entry.drillId.replace(/^demo-(home|program)-/, "").replace(/-/g, " ")}</div>
                  <div style={{ color: "var(--text-2)", fontSize: "0.9rem" }}>{entry.date}</div>
                </div>
                <div style={{ color: "var(--accent)", fontWeight: 800, fontSize: "1.5rem" }}>{entry.score}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...cardStyle, display: "grid", gap: "14px", alignContent: "start" }}>
          <div>
            <div style={{ color: "var(--text-1)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>Next Program Session</div>
            <div style={{ color: "var(--accent)", fontWeight: 700, marginBottom: "4px" }}>{nextEvent.title}</div>
            <div style={{ color: "var(--text-2)", lineHeight: 1.5 }}>
              {nextEvent.date} • {nextEvent.time}
              <br />
              {nextEvent.location}
            </div>
          </div>

          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "var(--surface-1)", border: "1px solid var(--stroke-1)" }}>
            <div style={{ color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.78rem", marginBottom: "8px" }}>Session Focus</div>
            <div style={{ color: "var(--text-1)", lineHeight: 1.6 }}>{nextEvent.desc}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
