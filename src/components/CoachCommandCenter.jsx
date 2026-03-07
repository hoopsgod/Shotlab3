import React from "react";

const FB = "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";
const FD = "'Bebas Neue','Impact','Arial Black',sans-serif";
const SPACE = {
  XS: "8px",
  SM: "12px",
  MD: "16px",
};

export default function CoachCommandCenter({
  variant = "full",
  totalPlayers,
  activeTodayCount,
  nextEventDateFormatted,
  highlightPlayersAttention,
  primaryQuickAction,
  onPlayersClick,
  onActiveTodayClick,
  onNextEventClick,
  onAddPlayer,
  onAddDrill,
  onScheduleEvent,
  onLogScore,
  joinCode,
  onCopyJoinCode,
  onRegenerateJoinCode,
  codeErr,
}) {
  const isCompact = variant === "compact";
  const metricBase = {
    minHeight: 56,
    borderRadius: 12,
    border: "1px solid var(--stroke-1)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.25))",
    padding: `${SPACE.SM} ${SPACE.SM}`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    cursor: "pointer",
    textAlign: "left",
  };

  const quickBtn = (isPrimary) => ({
    height: 44,
    minWidth: 130,
    borderRadius: 999,
    border: `1px solid ${isPrimary ? "var(--accent)" : "var(--stroke-1)"}`,
    background: isPrimary ? "var(--accent)" : "var(--surface-1)",
    color: isPrimary ? "#0B0D10" : "var(--text-2)",
    fontFamily: FB,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "var(--tracking-default)",
    textTransform: "uppercase",
    padding: `0 ${SPACE.MD}`,
    cursor: "pointer",
    boxShadow: "none",
    whiteSpace: "nowrap",
  });

  const compactActionBtn = (isPrimary) => ({
    minHeight: 44,
    minWidth: 44,
    borderRadius: 10,
    border: `1px solid ${isPrimary ? "var(--accent)" : "var(--stroke-1)"}`,
    background: isPrimary ? "var(--accent-soft)" : "var(--surface-2)",
    color: isPrimary ? "var(--accent)" : "var(--text-2)",
    fontFamily: FB,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "var(--tracking-tight)",
    textTransform: "uppercase",
    padding: `0 ${SPACE.SM}`,
    cursor: "pointer",
  });

  if (isCompact) {
    return (
      <section className="coach-command-center" style={{ padding: `${SPACE.XS} ${SPACE.SM} ${SPACE.SM}` }}>
        <style>{`.cc-tools-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}`}</style>

        <div
          style={{
            minHeight: 62,
            border: "1px solid var(--stroke-1)",
            borderRadius: 14,
            background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.22))",
            padding: `${SPACE.XS} ${SPACE.SM}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: SPACE.SM,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: SPACE.XS, minWidth: 0 }}>
            <span
              aria-hidden="true"
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                border: "1px solid var(--stroke-1)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-3)",
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              ⚡
            </span>
            <h2 className="u-allcaps-long" style={{ fontFamily: FD, fontSize: 13, color: "var(--text-secondary)", margin: 0, whiteSpace: "nowrap" }}>
              Coach Tools
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: SPACE.XS, flexShrink: 0 }}>
            <button type="button" onClick={onAddPlayer} aria-label="Add player" className="cc-tools-btn" style={compactActionBtn(primaryQuickAction === "addPlayer")}>+ Player</button>
            <button type="button" onClick={onAddDrill} aria-label="Add drill" className="cc-tools-btn" style={compactActionBtn(primaryQuickAction === "addDrill")}>+ Drill</button>
            <button type="button" onClick={onScheduleEvent} aria-label="Schedule event" className="cc-tools-btn" style={compactActionBtn(primaryQuickAction === "scheduleEvent")}>+ Event</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="coach-command-center" style={{ padding: `${SPACE.SM} ${SPACE.SM}` }}>
      <div style={{ marginBottom: SPACE.SM, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 className="u-allcaps-long" style={{ fontFamily: FD, fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
          Coach Command Center
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: SPACE.XS }}>
        <button type="button" onClick={onPlayersClick} style={{ ...metricBase, border: highlightPlayersAttention ? "1px solid rgba(255,69,69,0.45)" : metricBase.border, boxShadow: "none" }}>
          <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: "var(--tracking-default)", color: "var(--text-tertiary)", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis" }}>Players</div>
          <div style={{ marginTop: SPACE.XS, fontFamily: FD, fontSize: 23, fontWeight: 900, lineHeight: 1, color: "var(--accent)" }}>{totalPlayers}</div>
        </button>

        <button type="button" onClick={onActiveTodayClick} style={metricBase}>
          <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: "var(--tracking-default)", color: "var(--text-tertiary)", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis" }}>Active Today</div>
          <div style={{ marginTop: SPACE.XS, fontFamily: FD, fontSize: 23, fontWeight: 900, lineHeight: 1, color: "var(--text-1)" }}>{activeTodayCount}</div>
        </button>

        <button type="button" onClick={onNextEventClick} style={metricBase}>
          <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: "var(--tracking-default)", color: "var(--text-tertiary)", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis" }}>Next Event</div>
          <div style={{ marginTop: SPACE.XS, fontFamily: FD, fontSize: 16, fontWeight: 900, lineHeight: 1, color: "var(--text-1)" }}>{nextEventDateFormatted}</div>
        </button>
      </div>

      <div style={{ marginTop: SPACE.SM, overflowX: "auto", whiteSpace: "nowrap", paddingBottom: 2 }}>
        <div style={{ display: "flex", gap: SPACE.XS, alignItems: "stretch" }}>
          <button type="button" onClick={onAddPlayer} style={quickBtn(primaryQuickAction === "addPlayer")}>+ Add Player</button>
          <button type="button" onClick={onAddDrill} style={quickBtn(primaryQuickAction === "addDrill")}>+ Add Drill</button>
          <button type="button" onClick={onScheduleEvent} style={quickBtn(primaryQuickAction === "scheduleEvent")}>+ Schedule Event</button>
          <button type="button" onClick={onLogScore} style={quickBtn(false)}>+ Log Score</button>
        </div>
      </div>

      <div style={{ margin: `${SPACE.SM} 0 ${SPACE.XS}`, padding: SPACE.MD, border: "1px solid var(--stroke-1)", borderRadius: 14, background: "var(--surface-2)" }}>
        <div className="u-meta-label" style={{ fontFamily: FB, fontSize: 10, color: "var(--text-2)" }}>TEAM CODE</div>
        <div style={{ display: "flex", alignItems: "center", gap: SPACE.XS, marginTop: SPACE.XS, flexWrap: "wrap" }}>
          <div style={{ fontFamily: FD, fontSize: 25, color: "var(--text-1)", letterSpacing: 4, minWidth: 114, lineHeight: 1 }}>{joinCode || "—"}</div>
          <button onClick={onCopyJoinCode} style={{ height: 44, padding: `0 ${SPACE.SM}`, fontSize: 10, border: "1px solid var(--stroke-1)", background: "var(--surface-1)", color: "var(--text-1)", borderRadius: 10, cursor: "pointer", fontWeight: 700, letterSpacing: "var(--tracking-wide)" }}>COPY</button>
          <button onClick={onRegenerateJoinCode} style={{ height: 44, padding: `0 ${SPACE.SM}`, fontSize: 10, border: "1px solid var(--stroke-1)", background: "var(--surface-1)", color: "var(--text-1)", borderRadius: 10, cursor: "pointer", fontWeight: 700, letterSpacing: "var(--tracking-tight)" }}>REGENERATE</button>
        </div>
        {codeErr && <div style={{ color: "#FF4545", fontSize: 11, marginTop: SPACE.XS }}>{codeErr}</div>}
      </div>
    </section>
  );
}
