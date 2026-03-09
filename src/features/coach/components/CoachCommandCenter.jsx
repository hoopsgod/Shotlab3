import React from "react";
import Button from "../../../shared/ui/Button";

const FB = "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";
const FD = "'Bebas Neue','Impact','Arial Black',sans-serif";

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
    minHeight: 64,
    borderRadius: 12,
    border: "1px solid var(--stroke-1)",
    background: "var(--surface-2)",
    padding: "var(--space-3)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    cursor: "pointer",
    textAlign: "left",
  };

  const actionVariant = (isPrimary) => (isPrimary ? "primary" : "tertiary");

  if (isCompact) {
    return (
      <section style={{ padding: "var(--space-2) var(--space-3) var(--space-3)" }}>
        <div style={{ minHeight: 64, border: "1px solid var(--stroke-1)", borderRadius: 12, background: "var(--surface-2)", padding: "var(--space-2) var(--space-3)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--control-gap-tight)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 0 }}>
            <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: 999, border: "1px solid var(--stroke-1)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", fontSize: 13, flexShrink: 0 }}>⚡</span>
            <h2 className="u-allcaps-long" style={{ fontFamily: FD, fontSize: 13, color: "var(--text-secondary)", margin: 0, whiteSpace: "nowrap" }}>Coach tools</h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", flexShrink: 0 }}>
            <Button onClick={onAddPlayer} aria-label="Add player" variant={actionVariant(primaryQuickAction === "addPlayer")} size="medium">Add player</Button>
            <Button onClick={onAddDrill} aria-label="Add drill" variant={actionVariant(primaryQuickAction === "addDrill")} size="medium">Add drill</Button>
            <Button onClick={onScheduleEvent} aria-label="Schedule event" variant={actionVariant(primaryQuickAction === "scheduleEvent")} size="medium">Schedule event</Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: "var(--space-3)" }}>
      <div style={{ marginBottom: "var(--space-3)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 className="u-allcaps-long" style={{ fontFamily: FD, fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
          Coach command center
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "var(--grid-gutter)" }}>
        <button type="button" onClick={onPlayersClick} className="cc-action-btn" style={{ ...metricBase, border: highlightPlayersAttention ? "1px solid rgba(255,69,69,0.45)" : metricBase.border, boxShadow: "none" }}>
          <div style={{ fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: "0.02em", color: "var(--text-2)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis" }}>Players</div>
          <div style={{ marginTop: "var(--space-1)", fontFamily: FD, fontSize: 23, fontWeight: 900, lineHeight: 1, color: "var(--accent)" }}>{totalPlayers}</div>
          <div style={{ marginTop: "var(--space-1)", fontFamily: FB, fontSize: 10, color: "var(--text-2)", letterSpacing: "0.01em", lineHeight: 1.3 }}>{highlightPlayersAttention ? "Needs check-ins" : "On track"}</div>
        </button>

        <button type="button" onClick={onActiveTodayClick} className="cc-action-btn" style={metricBase}>
          <div style={{ fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: "0.02em", color: "var(--text-2)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis" }}>Active today</div>
          <div style={{ marginTop: "var(--space-1)", fontFamily: FD, fontSize: 23, fontWeight: 900, lineHeight: 1, color: "var(--text-1)" }}>{activeTodayCount}</div>
          <div style={{ marginTop: "var(--space-1)", fontFamily: FB, fontSize: 10, color: "var(--text-2)", letterSpacing: "0.01em", lineHeight: 1.3 }}>Session logs</div>
        </button>

        <button type="button" onClick={onNextEventClick} className="cc-action-btn" style={metricBase}>
          <div style={{ fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: "0.02em", color: "var(--text-2)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis" }}>Next event</div>
          <div style={{ marginTop: "var(--space-1)", fontFamily: FD, fontSize: 16, fontWeight: 900, lineHeight: 1, color: "var(--text-1)" }}>{nextEventDateFormatted}</div>
          <div style={{ marginTop: "var(--space-1)", fontFamily: FB, fontSize: 10, color: "var(--text-2)", letterSpacing: "0.01em", lineHeight: 1.3 }}>Timeline</div>
        </button>
      </div>

      <div style={{ marginTop: "var(--space-3)", overflowX: "auto", whiteSpace: "nowrap", paddingBottom: "var(--space-1)" }}>
        <div style={{ display: "flex", gap: "var(--control-gap)" }}>
          <Button onClick={onAddPlayer} variant={actionVariant(primaryQuickAction === "addPlayer")} size="large">Add player</Button>
          <Button onClick={onAddDrill} variant={actionVariant(primaryQuickAction === "addDrill")} size="large">Add drill</Button>
          <Button onClick={onScheduleEvent} variant={actionVariant(primaryQuickAction === "scheduleEvent")} size="large">Schedule event</Button>
          <Button onClick={onLogScore} variant="tertiary" size="large">Log score</Button>
        </div>
      </div>

      <div style={{ margin: "var(--space-3) 0 var(--space-1)", padding: "var(--space-3)", border: "1px solid var(--stroke-1)", borderRadius: 12, background: "var(--surface-2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--control-gap)" }}>
          <div>
            <div style={{ fontFamily: FB, fontSize: 11, color: "var(--text-2)", fontWeight: 700, letterSpacing: "0.02em" }}>Team code</div>
            <div style={{ fontFamily: FB, fontSize: 10, color: "var(--text-2)", letterSpacing: "0.01em", lineHeight: 1.35, marginTop: "var(--space-1)" }}>Share with players to join roster</div>
          </div>
          <div style={{ fontFamily: FD, fontSize: "clamp(20px, 5vw, 24px)", color: "var(--text-1)", letterSpacing: 4, lineHeight: 1, maxWidth: "52%", overflow: "hidden", textOverflow: "ellipsis" }}>{joinCode || "—"}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "var(--control-gap)", marginTop: "var(--space-3)" }}>
          <Button onClick={onCopyJoinCode} variant="tertiary">Copy code</Button>
          <Button onClick={onRegenerateJoinCode} variant="secondary">Regenerate</Button>
        </div>
        {codeErr && <div style={{ color: "var(--color-state-danger, #a86b6b)", fontSize: 11, marginTop: "var(--space-2)" }}>{codeErr}</div>}
      </div>
    </section>
  );
}
