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

  const metricCards = [
    { label: "Roster Capacity", value: totalPlayers, tone: "var(--accent)", onClick: onPlayersClick, warn: highlightPlayersAttention },
    { label: "Athletes Live Today", value: activeTodayCount, tone: "var(--text-1)", onClick: onActiveTodayClick },
    { label: "Next Session Window", value: nextEventDateFormatted, tone: "var(--text-1)", onClick: onNextEventClick, isDate: true },
  ];

  if (isCompact) {
    return (
      <section style={{ padding: "8px 12px 12px" }}>
        <style>{`.cc-tools-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}`}</style>
        <div style={{ borderRadius: 16, background: "linear-gradient(140deg, color-mix(in srgb,var(--accent) 15%, rgba(8,10,12,0.96)), rgba(8,10,12,0.98) 58%)", boxShadow: "0 14px 28px rgba(0,0,0,0.34)", padding: "11px 10px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: 999, background: "color-mix(in srgb,var(--accent) 20%, transparent)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontSize: 12, flexShrink: 0 }}>⚡</span>
              <h2 className="u-allcaps-long" style={{ fontFamily: FD, fontSize: 13, color: "var(--text-1)", margin: 0, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>Sideline Command</h2>
            </div>
            <div style={{ fontFamily: FB, fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Live</div>
          </div>

          <button type="button" onClick={primaryAction.onClick} style={{ height: 44, width: "100%", borderRadius: 12, border: "none", background: "var(--accent)", color: "#0B0D10", fontFamily: FB, fontSize: 13, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer", marginBottom: 8 }}>
            {primaryAction.label}
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 6 }}>
            {secondaryActions.map((action) => (
              <button key={action.key} type="button" onClick={action.onClick} aria-label={action.label} className="cc-tools-btn" style={{ minHeight: 38, borderRadius: 10, border: "none", background: "rgba(255,255,255,0.07)", color: "var(--text-2)", fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", padding: "0 8px", cursor: "pointer" }}>
                {action.short}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: "12px 12px 14px" }}>
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 24, background: "radial-gradient(circle at 88% 10%, color-mix(in srgb,var(--accent) 26%, transparent) 0%, transparent 44%), linear-gradient(154deg, rgba(12,16,20,0.98), rgba(8,10,12,0.96) 56%)", boxShadow: "0 24px 44px rgba(0,0,0,0.36)", padding: "16px 14px 14px" }}>
        <div style={{ position: "absolute", top: -26, right: -36, width: 130, height: 130, borderRadius: "50%", background: "color-mix(in srgb, var(--accent) 24%, transparent)", filter: "blur(34px)", pointerEvents: "none" }} />

        <div style={{ position: "relative", display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontFamily: FB, fontSize: 10, letterSpacing: "0.09em", color: "var(--text-3)", textTransform: "uppercase" }}>Coach Mission Control</div>
            <div style={{ fontFamily: FD, fontSize: 22, lineHeight: 1, color: "var(--text-1)", marginTop: 4, letterSpacing: "0.03em" }}>Command Today’s Performance</div>
            <p style={{ margin: "7px 0 0", fontFamily: FB, fontSize: 13, color: "var(--text-2)", lineHeight: 1.35 }}>Launch your core coaching action first, then monitor readiness signals and team access from one unified surface.</p>
          </div>

          <button type="button" onClick={primaryAction.onClick} style={{ height: 50, width: "100%", borderRadius: 13, border: "none", background: "linear-gradient(180deg, color-mix(in srgb,var(--accent) 94%, #f1ff8a), var(--accent))", color: "#0B0D10", fontFamily: FB, fontSize: 14, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 10px 24px color-mix(in srgb,var(--accent) 36%, transparent)" }}>
            {primaryAction.label}
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 7 }}>
            {secondaryActions.map((action) => (
              <button key={action.key} type="button" onClick={action.onClick} style={{ minHeight: 38, borderRadius: 10, border: "none", background: "rgba(255,255,255,0.08)", color: "var(--text-2)", fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", cursor: "pointer" }}>
                {action.short}
              </button>
            ))}
          </div>

          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", margin: "1px 0" }} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
            {metricCards.map((metric) => (
              <button key={metric.label} type="button" onClick={metric.onClick} style={{ minHeight: 82, borderRadius: 14, border: metric.warn ? "1px solid rgba(255,69,69,0.45)" : "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(170deg, rgba(255,255,255,0.08), rgba(0,0,0,0.22))", padding: "10px 10px", display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "left", cursor: "pointer" }}>
                <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-3)", textTransform: "uppercase" }}>{metric.label}</div>
                <div style={{ fontFamily: FD, fontSize: metric.isDate ? 17 : 26, lineHeight: 1, color: metric.tone }}>{metric.value}</div>
              </button>
            ))}
          </div>

          <div style={{ borderRadius: 16, background: "linear-gradient(135deg, color-mix(in srgb,var(--accent) 10%, rgba(255,255,255,0.05)), rgba(0,0,0,0.18) 54%)", padding: "12px 12px 11px" }}>
            <div className="u-meta-label" style={{ fontFamily: FB, fontSize: 10, color: "var(--text-3)", letterSpacing: "0.07em" }}>TEAM ACCESS CODE</div>
            <div style={{ marginTop: 4, fontFamily: FB, fontSize: 12, color: "var(--text-2)" }}>Invite athletes instantly with your live program code.</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <div style={{ fontFamily: FD, fontSize: 25, color: "var(--text-1)", letterSpacing: 4, minWidth: 114, lineHeight: 1 }}>{joinCode || "—"}</div>
              <button onClick={() => { onCopyJoinCode?.(); setCopied(true); setTimeout(() => setCopied(false), 1600); }} style={{ padding: "10px 14px", fontSize: 11, border: "none", background: "var(--accent)", color: "#0B0D10", borderRadius: 10, cursor: "pointer", fontWeight: 700, letterSpacing: "0.03em", minHeight: 38 }}>COPY CODE</button>
              <button onClick={onRegenerateJoinCode} style={{ padding: "10px 14px", fontSize: 11, border: "none", background: "rgba(255,255,255,0.08)", color: "var(--text-2)", borderRadius: 10, cursor: "pointer", fontWeight: 700, letterSpacing: "0.03em", minHeight: 38 }}>REGENERATE</button>
            </div>
            {copied && <div style={{ color: "var(--accent)", fontSize: 11, marginTop: 8, fontWeight: 700, letterSpacing: "0.03em" }}>Copied to clipboard.</div>}
            {codeErr && <div style={{ color: "#FF4545", fontSize: 11, marginTop: 6 }}>{codeErr}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
