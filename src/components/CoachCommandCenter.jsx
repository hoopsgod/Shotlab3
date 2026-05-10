import React from "react";
import { useMemo, useState } from "react";

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
  const [copied, setCopied] = useState(false);
  const isCompact = variant === "compact";

  const quickActions = useMemo(
    () => [
      { key: "addPlayer", label: "+ Add Player", short: "Player", onClick: onAddPlayer },
      { key: "addDrill", label: "+ Add Drill", short: "Drill", onClick: onAddDrill },
      { key: "scheduleEvent", label: "+ Schedule Event", short: "Event", onClick: onScheduleEvent },
      { key: "logScore", label: "+ Log Score", short: "Log Score", onClick: onLogScore },
    ],
    [onAddDrill, onAddPlayer, onLogScore, onScheduleEvent],
  );

  const primaryAction = quickActions.find((action) => action.key === primaryQuickAction) || quickActions[0];
  const secondaryActions = quickActions.filter((action) => action.key !== primaryAction.key);

  const metrics = [
    { label: "Roster Capacity", value: totalPlayers, onClick: onPlayersClick, tone: "var(--accent)", warn: highlightPlayersAttention },
    { label: "Athletes Live Today", value: activeTodayCount, onClick: onActiveTodayClick, tone: "var(--text-1)" },
    { label: "Next Session Window", value: nextEventDateFormatted, onClick: onNextEventClick, tone: "var(--text-1)", isDate: true },
  ];

  if (isCompact) {
    return (
      <section style={{ padding: "8px 12px 12px" }}>
        <style>{`.cc-tools-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}`}</style>
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 18, padding: "10px", background: "linear-gradient(145deg, rgba(9,11,14,0.98), rgba(8,10,12,0.96) 62%)", boxShadow: "0 18px 34px rgba(0,0,0,0.34)" }}>
          <div style={{ position: "absolute", right: -30, top: -28, width: 120, height: 120, borderRadius: "50%", background: "color-mix(in srgb,var(--accent) 22%, transparent)", filter: "blur(34px)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontFamily: FD, fontSize: 13, color: "var(--text-1)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Sideline Command</div>
              <div style={{ fontFamily: FB, fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Live</div>
            </div>

            <button type="button" onClick={primaryAction.onClick} style={{ marginTop: 8, height: 42, width: "100%", borderRadius: 12, border: "none", background: "var(--accent)", color: "#0B0D10", fontFamily: FB, fontSize: 13, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer" }}>
              {primaryAction.label}
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6, marginTop: 7 }}>
              {secondaryActions.map((action) => (
                <button key={action.key} type="button" onClick={action.onClick} aria-label={action.label} className="cc-tools-btn" style={{ minHeight: 36, borderRadius: 10, border: "none", background: "rgba(255,255,255,0.08)", color: "var(--text-2)", fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", cursor: "pointer" }}>
                  {action.short}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: "12px 12px 14px" }}>
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 26, padding: "18px 14px 14px", background: "radial-gradient(circle at 84% 8%, color-mix(in srgb,var(--accent) 26%, transparent), transparent 42%), radial-gradient(circle at 12% 100%, rgba(255,255,255,0.08), transparent 46%), linear-gradient(162deg, rgba(13,16,20,0.99), rgba(8,10,12,0.97) 58%)", boxShadow: "0 26px 52px rgba(0,0,0,0.38)" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg, rgba(255,255,255,0.06), transparent 35%, rgba(0,0,0,0.24) 100%)" }} />

        <div style={{ position: "relative", display: "grid", gap: 12 }}>
          <header style={{ display: "grid", gap: 6 }}>
            <div style={{ fontFamily: FB, fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.09em" }}>Coach Mission Control</div>
            <h2 style={{ margin: 0, fontFamily: FD, fontSize: 24, lineHeight: 0.95, letterSpacing: "0.03em", color: "var(--text-1)" }}>Own Today’s Team Momentum</h2>
            <p style={{ margin: 0, fontFamily: FB, fontSize: 13, lineHeight: 1.35, color: "var(--text-2)", maxWidth: 520 }}>Your daily command layer for training execution, athlete readiness, and roster flow—built to move like performance basketball, not admin software.</p>
          </header>

          <button type="button" onClick={primaryAction.onClick} style={{ height: 52, width: "100%", borderRadius: 14, border: "none", background: "linear-gradient(180deg, color-mix(in srgb,var(--accent) 96%, #f4ffa7), var(--accent))", color: "#0B0D10", fontFamily: FB, fontSize: 14, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 12px 26px color-mix(in srgb,var(--accent) 34%, transparent)" }}>
            {primaryAction.label}
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 7 }}>
            {secondaryActions.map((action) => (
              <button key={action.key} type="button" onClick={action.onClick} style={{ minHeight: 38, borderRadius: 10, border: "none", background: "rgba(255,255,255,0.1)", color: "var(--text-2)", fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", cursor: "pointer" }}>
                {action.short}
              </button>
            ))}
          </div>

          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.24), transparent)" }} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
            {metrics.map((metric) => (
              <button key={metric.label} type="button" onClick={metric.onClick} style={{ minHeight: 88, borderRadius: 14, border: "none", background: metric.warn ? "linear-gradient(170deg, rgba(255,90,90,0.14), rgba(0,0,0,0.22))" : "linear-gradient(170deg, rgba(255,255,255,0.11), rgba(0,0,0,0.2))", padding: "10px 10px", display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "left", cursor: "pointer", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                <div style={{ fontFamily: FB, fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>{metric.label}</div>
                <div style={{ fontFamily: FD, fontSize: metric.isDate ? 17 : 28, lineHeight: 1, color: metric.tone }}>{metric.value}</div>
              </button>
            ))}
          </div>

          <div style={{ borderRadius: 16, padding: "12px", background: "linear-gradient(145deg, color-mix(in srgb,var(--accent) 14%, rgba(255,255,255,0.05)), rgba(0,0,0,0.16) 55%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div className="u-meta-label" style={{ fontFamily: FB, fontSize: 10, color: "var(--text-3)", letterSpacing: "0.08em" }}>TEAM ACCESS CODE</div>
                <div style={{ marginTop: 4, fontFamily: FB, fontSize: 12, color: "var(--text-2)" }}>Share your live program entry code.</div>
              </div>
              <div style={{ fontFamily: FD, fontSize: 25, color: "var(--text-1)", letterSpacing: 4, lineHeight: 1 }}>{joinCode || "—"}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button onClick={() => { onCopyJoinCode?.(); setCopied(true); setTimeout(() => setCopied(false), 1600); }} style={{ padding: "10px 14px", minHeight: 38, borderRadius: 10, border: "none", background: "var(--accent)", color: "#0B0D10", fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: "0.03em", cursor: "pointer" }}>COPY CODE</button>
              <button onClick={onRegenerateJoinCode} style={{ padding: "10px 14px", minHeight: 38, borderRadius: 10, border: "none", background: "rgba(255,255,255,0.1)", color: "var(--text-2)", fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: "0.03em", cursor: "pointer" }}>REGENERATE</button>
            </div>
            {copied && <div style={{ color: "var(--accent)", fontSize: 11, marginTop: 8, fontWeight: 700, letterSpacing: "0.03em" }}>Copied to clipboard.</div>}
            {codeErr && <div style={{ color: "#FF4545", fontSize: 11, marginTop: 6 }}>{codeErr}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
