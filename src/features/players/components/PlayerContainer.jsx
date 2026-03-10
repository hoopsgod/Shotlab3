import { useEffect, useRef, useState } from "react";

export function useDismissedGuide(storageKey) {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem(storageKey) !== "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, visible ? "0" : "1");
    } catch {}
  }, [storageKey, visible]);

  return [visible, () => setVisible(false)];
}

export function GuideCallout({ title, body, onDismiss, tone = "accent" }) {
  const toneMap = {
    accent: { bg: "linear-gradient(140deg, rgba(63,95,151,0.22) 0%, rgba(63,95,151,0.12) 55%, var(--surface-1) 100%)", border: "1px solid rgba(63,95,151,0.55)", title: "var(--accent)" },
    warm: { bg: "linear-gradient(140deg, rgba(182,170,148,0.2) 0%, rgba(182,170,148,0.1) 55%, var(--surface-1) 100%)", border: "1px solid rgba(182,170,148,0.44)", title: "var(--text-1)" },
    cool: { bg: "linear-gradient(140deg, rgba(126,153,190,0.2) 0%, rgba(126,153,190,0.1) 55%, var(--surface-1) 100%)", border: "1px solid rgba(126,153,190,0.4)", title: "var(--text-1)" },
  };
  const palette = toneMap[tone] || toneMap.accent;
  return <div className="info-explainer-card" style={{ background: palette.bg, border: palette.border, marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="info-explainer-card__title" style={{ color: palette.title }}>{title}</div>
      <div className="info-explainer-card__body">{body}</div>
    </div>
    {onDismiss && <button className="info-explainer-card__button" onClick={onDismiss} aria-label="Dismiss onboarding tip">Got it</button>}
  </div>;
}

export function FgArc({ percentage = 0, label = "FG%" }) {
  const arcRef = useRef(null);
  const normalizedPct = Math.max(0, Math.min(100, Number(percentage) || 0));
  const radius = 50;
  const circumference = Math.PI * radius;
  const color = normalizedPct < 40 ? "#FF3B5C" : normalizedPct < 55 ? "#FFB830" : "#1EE07F";

  useEffect(() => {
    const arc = arcRef.current;
    if (!arc) return;
    const targetOffset = circumference - (normalizedPct / 100) * circumference;
    arc.style.strokeDasharray = `${circumference}`;
    arc.style.transition = "none";
    arc.style.strokeDashoffset = `${circumference}`;
    const raf = requestAnimationFrame(() => {
      arc.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)";
      arc.style.strokeDashoffset = `${targetOffset}`;
    });
    return () => cancelAnimationFrame(raf);
  }, [circumference, normalizedPct]);

  return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
    <svg viewBox="0 0 120 70" width="100%" style={{ maxWidth: 260, display: "block" }} aria-label={`${label} ${normalizedPct}%`} role="img">
      <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#181C24" strokeWidth="10"/>
      <path ref={arcRef} d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"/>
    </svg>
    <div style={{ textAlign: "center", lineHeight: 1 }}>
      <div style={{ fontFamily: "'Bebas Neue','Impact','Arial Black',sans-serif", color, fontSize: 38, letterSpacing: 1 }}>{normalizedPct}%</div>
      <div style={{ fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif", color: "var(--text-3)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>{label}</div>
    </div>
  </div>;
}

export function InfoHint({ text }) {
  return <span title={text} aria-label={text} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", border: "1px solid var(--border-1)", color: "var(--text-2)", fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>i</span>;
}

export default function buildPlayerContainerConfig({
  PlayerComponent,
  user,
  myTeam,
  drills,
  programDrills,
  scopedScores,
  addScore,
  scopedEvents,
  scopedRsvps,
  toggleRsvp,
  scopedShotLogs,
  addShotLog,
  scopedChallenges,
  addChallenge,
  respondChallenge,
  scopedPlayers,
  T,
  theme,
  setTheme,
  scopedScSessions,
  scopedScRsvps,
  toggleScRsvp,
  scopedScLogs,
  addScLog,
  logout,
  deleteAccount,
  resetPassword,
  highContrast,
  setHighContrast,
}) {
  return {
    PlayerComponent,
    playerProps: { u: user, team: myTeam, drills, programDrills, scores: scopedScores, addScore, events: scopedEvents, rsvps: scopedRsvps, toggleRsvp, shotLogs: scopedShotLogs, addShotLog, challenges: scopedChallenges, addChallenge, respondChallenge, players: scopedPlayers, T, theme, setTheme, scSessions: scopedScSessions, scRsvps: scopedScRsvps, toggleScRsvp, scLogs: scopedScLogs, addScLog, logout, deleteAccount, onResetPassword: resetPassword, highContrast, onToggleHighContrast: () => setHighContrast((v) => !v) },
  };
}
