import { useEffect, useRef, useState } from "react";
import { installPlayerAssignmentEnhancer } from "../lib/playerAssignmentEnhancer.js";
import { ExperiencePill, ExperienceProgressRing, ExperienceSignal } from "./PlayerDailyPrimitives.jsx";
import ShotLabIcon from "./ShotLabIcon";
import styles from "./PlayerDailyCommandCenter.module.css";

const urgencyLabel = (urgency = "normal") => {
  if (urgency === "urgent") return "Needs attention";
  if (urgency === "priority") return "Priority";
  if (urgency === "complete") return "Complete";
  return "Next action";
};
const rankLabel = (rank = 0) => (Number(rank) > 0 ? `#${Number(rank)}` : "—");
const actionKey = (action = {}) => String(action.id || action.kind || action.target || action.title || "action");
const coachSignalStatus = (signal = {}) => signal.stale ? "Stale" : signal.freshness === "current" ? signal.ageDays === 0 ? "Published today" : `${signal.ageDays}d old` : "Unverified";
const coachSignalIcon = (signal = {}) => signal.stale ? "clock" : signal.freshness === "current" ? "verified" : "neutral";
const iconButtonStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9 };
const PHASE2_COMPOSITION_CSS = `
@media(max-width:700px){
  [data-phase2-composition="edge-to-edge-performance-story"]{padding:0 0 8px!important;overflow:visible!important}
  [data-phase2-composition="edge-to-edge-performance-story"]>[data-layout-role="editorial-header"]{display:none!important}
  [data-phase2-composition="edge-to-edge-performance-story"]>[data-command-role="primary"]{position:relative!important;display:flex!important;flex-direction:column!important;min-height:526px!important;margin:0!important;padding:42px 20px 18px!important;overflow:hidden!important;border:0!important;border-radius:0 0 44px 14px!important;background:radial-gradient(circle at 112% 25%,rgba(200,255,26,.22),transparent 34%),radial-gradient(circle at -8% 88%,rgba(69,130,151,.26),transparent 39%),linear-gradient(155deg,#0b2a38 0,#06151c 72%)!important;box-shadow:0 34px 72px rgba(7,24,32,.28)!important;color:#f7fafb!important;isolation:isolate!important}
  [data-phase2-composition="edge-to-edge-performance-story"]>[data-command-role="primary"]:before{opacity:.52!important;background:radial-gradient(ellipse 45% 68% at 108% 39%,transparent 64%,rgba(200,255,26,.18) 64.6%,transparent 65.4%),linear-gradient(90deg,transparent 77%,rgba(255,255,255,.07) 77.2%,transparent 77.5%)!important}
  [data-phase2-composition="edge-to-edge-performance-story"]>[data-command-role="primary"]:after{right:-54px!important;bottom:-102px!important;width:250px!important;height:250px!important;background:rgba(200,255,26,.12)!important;filter:blur(44px)!important}
  [data-phase2-composition="edge-to-edge-performance-story"] [data-command-role="primary"]>div:first-child{position:relative!important;z-index:2!important;width:100%!important}
  [data-phase2-composition="edge-to-edge-performance-story"] [data-command-role="primary"] h1{position:relative!important;z-index:2!important;max-width:6.7ch!important;margin:46px 0 0!important;color:#f7fafb!important;font-size:clamp(46px,12.6vw,54px)!important;font-weight:860!important;line-height:.84!important;letter-spacing:-.075em!important;text-wrap:balance!important}
  [data-phase2-composition="edge-to-edge-performance-story"] [data-command-role="primary"]>p{position:relative!important;z-index:2!important;max-width:22ch!important;margin:16px 0 0!important;color:#aec0c8!important;font-size:14px!important;line-height:1.46!important}
  [data-phase2-composition="edge-to-edge-performance-story"] [data-testid="player-daily-primary-action"]{position:relative!important;z-index:3!important;order:6!important;width:100%!important;min-height:58px!important;margin-top:14px!important;border:0!important;border-radius:20px 20px 20px 7px!important;background:linear-gradient(135deg,#c8ff1a,#aee800)!important;color:#071007!important;box-shadow:0 16px 34px rgba(174,232,0,.18),inset 0 1px rgba(255,255,255,.4)!important;font-size:15px!important}
  .playerPhase2Gauge{--phase2-progress:0%;position:absolute;z-index:1;top:112px;right:-46px;width:178px;height:178px;display:grid;place-items:center;border-radius:50%;background:conic-gradient(#c8ff1a var(--phase2-progress),rgba(255,255,255,.09) 0);box-shadow:0 30px 70px rgba(0,0,0,.24),0 0 0 1px rgba(255,255,255,.08)}
  .playerPhase2Gauge:before{content:"";position:absolute;inset:14px;border-radius:50%;background:radial-gradient(circle at 35% 25%,#123746,#071820 70%);box-shadow:inset 0 1px rgba(255,255,255,.10)}
  .playerPhase2Gauge>span,.playerPhase2Gauge>small{position:absolute;z-index:1;color:#f7fafb;font-family:var(--font-display)}
  .playerPhase2Gauge>span{top:54px;font-size:41px;font-weight:870;letter-spacing:-.07em}.playerPhase2Gauge>span b{color:#c8ff1a;font-size:15px;margin-left:2px}.playerPhase2Gauge>small{top:103px;color:#91a2aa;font-size:11px;font-weight:760;letter-spacing:.12em;text-transform:uppercase}
  .playerMomentumTrajectory{position:relative;z-index:2;order:4;margin-top:auto;padding-top:18px}
  .playerMomentumTrajectory svg{display:block;width:100%;height:58px;overflow:visible}.playerMomentumTrajectoryTrack{fill:none;stroke:rgba(255,255,255,.11);stroke-width:2}.playerMomentumTrajectoryProgress{fill:none;stroke:#c8ff1a;stroke-width:3;stroke-linecap:round;filter:drop-shadow(0 0 7px rgba(200,255,26,.24))}.playerMomentumTrajectoryMarker{fill:#c8ff1a;stroke:#071820;stroke-width:4}
  .playerMomentumTrajectoryLabels{display:flex;justify-content:space-between;margin-top:-3px;color:#91a2aa;font-size:11px;font-weight:750;letter-spacing:.07em;text-transform:uppercase}.playerMomentumTrajectoryLabels strong{color:#dfe7ea;font-size:11px}
  .playerCanvasEvidence{position:relative;z-index:2;order:5;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin-top:14px;border-block:1px solid rgba(255,255,255,.10)}
  .playerCanvasEvidence>div{min-width:0;padding:11px 8px 12px;border-right:1px solid rgba(255,255,255,.09)}.playerCanvasEvidence>div:first-child{padding-left:0}.playerCanvasEvidence>div:last-child{padding-right:0;border-right:0}.playerCanvasEvidence small{display:block;color:#8fa1a9;font-size:11px;font-weight:740;letter-spacing:.07em;text-transform:uppercase}.playerCanvasEvidence strong{display:block;margin-top:5px;overflow:hidden;color:#f7fafb;font-family:var(--font-display);font-size:20px;font-weight:820;letter-spacing:-.04em;text-overflow:ellipsis;white-space:nowrap}
  [data-phase2-composition="edge-to-edge-performance-story"]>[data-testid="player-command-evidence"]{display:none!important}
  [data-phase2-composition="edge-to-edge-performance-story"]>[data-testid="player-coach-priority-signal"],[data-phase2-composition="edge-to-edge-performance-story"]>[data-command-role="next-actions"],[data-phase2-composition="edge-to-edge-performance-story"]>details{margin-inline:16px!important}
  [data-phase2-composition="edge-to-edge-performance-story"]>[data-testid="player-coach-priority-signal"]{margin-top:18px!important;border-radius:24px 24px 24px 8px!important;background:rgba(255,255,255,.78)!important}
}
@media(max-width:365px){.playerPhase2Gauge{right:-58px;width:164px;height:164px}.playerPhase2Gauge:before{inset:13px}.playerPhase2Gauge>span{top:50px}.playerPhase2Gauge>small{top:96px}[data-phase2-composition="edge-to-edge-performance-story"] [data-command-role="primary"] h1{font-size:44px!important}}
@media(max-width:700px) and (prefers-reduced-motion:reduce){.playerMomentumTrajectoryProgress{filter:none}.playerPhase2Gauge{box-shadow:0 0 0 1px rgba(255,255,255,.08)}}
`;

export default function PlayerDailyCommandCenter({ model, onAction }) {
  const [activeAction, setActiveAction] = useState("");
  const feedbackTimer = useRef(null);

  useEffect(() => {
    installPlayerAssignmentEnhancer();
  }, []);

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);
  if (!model?.primaryAction) return null;

  const primary = model.primaryAction;
  const dailyPercent = Math.max(0, Math.round(Number(model.daily?.pct) || 0));
  const dailyGaugePercent = `${Math.min(100, dailyPercent)}%`;
  const weeklyPercent = Math.max(0, Math.min(100, Math.round(Number(model.weekly?.pct) || 0)));
  const weeklyTrajectoryT = weeklyPercent / 100;
  const weeklyTrajectoryX = 8 + (304 * weeklyTrajectoryT);
  const weeklyTrajectoryY = ((1 - weeklyTrajectoryT) ** 2 * 48) + (2 * (1 - weeklyTrajectoryT) * weeklyTrajectoryT * -8) + (weeklyTrajectoryT ** 2 * 18);
  const queue = Array.isArray(model.queue) ? model.queue.slice(1, 3) : [];
  const coachSignal = model.coachSignal || {};
  const firstSession = model.firstSession || {};
  const dailyRemaining = Math.max((Number(model.daily?.goal) || 0) - (Number(model.daily?.makes) || 0), 0);
  const dailyComplete = Number(model.daily?.pct) >= 100 || primary.urgency === "complete";
  const weeklyComplete = Number(model.weekly?.pct) >= 100;
  const momentumTone = dailyComplete ? "positive" : primary.urgency === "urgent" ? "attention" : "info";
  const momentumTitle = dailyComplete ? "Daily target complete" : dailyRemaining > 0 ? `${dailyRemaining} makes from today’s target` : "Your next action is ready";
  const momentumDetail = dailyComplete
    ? weeklyComplete ? "Today and this week are complete. Review progress or protect the streak with optional work." : `${model.weekly.makes} of ${model.weekly.goal} makes this week. Choose the next action that best builds on today’s work.`
    : `${model.streak || 0}-day streak · ${rankLabel(model.leaderboardRank)} team rank · ${model.actionableCount} open ${model.actionableCount === 1 ? "action" : "actions"}.`;
  const progressShouldOpen = dailyComplete || primary.urgency === "urgent";
  const runAction = (action) => {
    const key = actionKey(action);
    setActiveAction(key);
    onAction?.(action);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setActiveAction(""), 900);
  };
  const primaryWorking = activeAction === actionKey(primary);
  const evidence = [
    { label: "Today", value: `${model.daily.makes}/${model.daily.goal}`, pct: model.daily.pct, aria: `Today: ${model.daily.makes} of ${model.daily.goal} makes` },
    { label: "This week", value: `${model.weekly.makes}/${model.weekly.goal}`, pct: model.weekly.pct, aria: `This week: ${model.weekly.makes} of ${model.weekly.goal} makes` },
    { label: "Streak", value: `${model.streak || 0}d`, aria: `Current streak: ${model.streak || 0} days` },
  ];

  return (<>
    <style>{PHASE2_COMPOSITION_CSS}</style>
    <section className={styles.root} data-testid="player-daily-command-center" data-phase="phase-2-command-hierarchy" data-page-hierarchy="activation-loop" data-mobile-product-reset="phase-1" data-mobile-visual-system="phase-2" data-phase2-composition="edge-to-edge-performance-story" aria-label="Daily training command center">
      <div className={styles.header} data-layout-role="editorial-header">
        <div className={styles.eyebrow}>{firstSession.pending ? "First session · Create your baseline" : "Today’s focus"}</div>
        <div className={styles.status}>{firstSession.pending ? "Activation" : urgencyLabel(primary.urgency)}</div>
      </div>

      <div className={`${styles.hero} ${dailyComplete ? styles.heroComplete : ""}`} data-testid="player-performance-canvas" data-command-role="primary" data-layout-role="primary-decision">
        <div className={styles.heroTop}>
          <ExperiencePill tone={primary.source === "coach" ? "info" : primary.source === "team" ? "attention" : "positive"}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <ShotLabIcon name={primary.source === "activation" ? "plus" : primary.source === "coach" ? "coach" : primary.source === "team" ? "team" : "training"} size={13} />
              {primary.source === "activation" ? "First result" : primary.source === "coach" ? "Coach directed" : primary.source === "team" ? "Team commitment" : "Personal development"}
            </span>
          </ExperiencePill>
          <div className={styles.meta}>About {primary.estimatedMinutes || 1} min</div>
        </div>
        <h1 className={styles.title}>{dailyComplete ? "Daily work banked." : primary.title}</h1>
        <p className={styles.description}>{dailyComplete ? "Today’s standard is complete. Build on the week, review progress, or handle the next team commitment." : primary.detail}</p>
        <div className="playerPhase2Gauge" data-testid="player-hero-progress" role="img" aria-label={`${dailyPercent}% of today’s target`} style={{ "--phase2-progress": dailyGaugePercent }}><span>{dailyPercent}<b>%</b></span><small>Today</small></div>
        <button type="button" className={styles.primaryButton} style={iconButtonStyle} data-testid="player-daily-primary-action" data-state={primaryWorking ? "working" : "idle"} onClick={() => runAction(primary)}>
          <span>{primaryWorking ? "Opening…" : primary.actionLabel}</span>
          <ShotLabIcon name={primaryWorking ? "clock" : dailyComplete ? "check" : "arrow"} size={18} />
        </button>
        <div className="playerMomentumTrajectory" data-testid="player-momentum-trajectory" role="img" aria-label={`${weeklyPercent}% of the weekly training target`}>
          <svg viewBox="0 -12 320 76" aria-hidden="true">
            <path className="playerMomentumTrajectoryTrack" d="M8 48 Q160 -8 312 18" pathLength="100" />
            <path className="playerMomentumTrajectoryProgress" d="M8 48 Q160 -8 312 18" pathLength="100" style={{ strokeDasharray: `${weeklyPercent} 100` }} />
            <circle className="playerMomentumTrajectoryMarker" cx={weeklyTrajectoryX} cy={weeklyTrajectoryY} r="6" />
          </svg>
          <div className="playerMomentumTrajectoryLabels"><span>Week trajectory</span><strong>{weeklyPercent}% banked</strong></div>
        </div>
        <div className="playerCanvasEvidence" data-testid="player-canvas-evidence" role="group" aria-label="Performance proof">
          {evidence.map((item) => <div key={item.label}><small>{item.label}</small><strong>{item.value}</strong></div>)}
        </div>
      </div>

      <div className={styles.progressGrid} role="group" data-testid="player-command-evidence" data-layout-role="supporting-evidence" aria-label="Today’s training evidence">
        {evidence.map((item) => <div className={styles.progressCard} key={item.label} aria-label={item.aria}>
          <div className={styles.progressHeader}><div className={styles.sectionLabel}>{item.label}</div>{item.pct != null && <div className={styles.meta}>{item.pct}%</div>}</div>
          <div className={styles.progressValue}>{item.value}</div>
          {item.pct != null && <div className={styles.progressTrack} aria-hidden="true"><div className={styles.progressFill} style={{ width: `${item.pct}%` }} /></div>}
        </div>)}
      </div>

      {firstSession.complete && !model.activation.complete && <div className={styles.momentumSignal} data-testid="player-first-result-confirmation" data-command-role="confirmation">
        <ExperienceSignal eyebrow="First session complete" title={firstSession.title || "First result banked"} detail={firstSession.detail || "Your training baseline is active. Every result from here builds your progress history."} tone="positive" icon="verified" />
      </div>}

      <section className={styles.coachSignal} data-testid="player-coach-priority-signal" data-command-role="coach-priority" data-layout-role="supporting-evidence" data-freshness={coachSignal.freshness || "unknown"} aria-label="Coach assignment" style={coachSignal.stale ? { "--coach-signal-accent": "#ffb547" } : undefined}>
        <div className={styles.coachSignalHeader}>
          <div>
            <div className={styles.coachSignalEyebrow} style={coachSignal.stale ? { color: "#ffca76" } : undefined}>{coachSignal.stale ? "Coach assignment needs refresh" : "Coach assignment"}</div>
            <h2 className={styles.coachSignalTitle}>{coachSignal.stale ? "Waiting for an updated team focus" : coachSignal.focus || "Build quality reps today"}</h2>
          </div>
          <span className={styles.coachSignalStatus} style={coachSignal.stale ? { borderColor: "rgba(255,181,71,.48)", background: "rgba(255,181,71,.12)", color: "#ffd18a", gap: 5 } : { gap: 5 }}>
            <ShotLabIcon name={coachSignalIcon(coachSignal)} size={13} /><span>{coachSignalStatus(coachSignal)}</span>
          </span>
        </div>
        <div className={styles.coachSignalGrid}>
          {coachSignal.stale ? <>
            <div className={styles.coachSignalItem}><div className={styles.coachSignalLabel}>Last published</div><div className={styles.coachSignalValue}>{coachSignal.ageDays} days ago</div></div>
            <div className={styles.coachSignalItem}><div className={styles.coachSignalLabel}>What to do</div><div className={styles.coachSignalValue}>Continue your current training plan until your coach republishes Team Focus.</div></div>
          </> : <>
            <div className={styles.coachSignalItem}><div className={styles.coachSignalLabel}>Priority drill</div><div className={styles.coachSignalValue}>{coachSignal.priorityDrill || "Next unfinished training block"}</div></div>
            <div className={styles.coachSignalItem}><div className={styles.coachSignalLabel}>Challenge</div><div className={styles.coachSignalValue}>{coachSignal.challenge || "Complete one focused block and log the result."}</div></div>
          </>}
        </div>
      </section>

      {queue.length > 0 && <div className={styles.section} data-command-role="next-actions" data-layout-role="quiet-secondary">
        <div className={styles.sectionHeading} data-visual-role="next-actions-heading"><div><div className={styles.sectionLabel} data-visual-role="next-actions-eyebrow">After this</div><div className={styles.sectionTitle} data-visual-role="next-actions-title">Your next moves</div></div><div className={styles.meta} data-visual-role="next-actions-meta">{queue.length} queued</div></div>
        <div className={styles.tasks} data-testid="player-daily-task-queue">
          {queue.map((task, index) => {
            const taskWorking = activeAction === actionKey(task);
            return <div className={styles.taskRow} key={task.id}>
              <div className={styles.taskIndex} aria-label={`Queued action ${index + 2}`}><ShotLabIcon name="neutral" size={17} /></div>
              <div className={styles.taskCopy}><div className={styles.taskTitle}>{task.title}</div><div className={styles.taskMeta}>{task.detail} · {task.estimatedMinutes || 1} min</div></div>
              <button type="button" className={styles.taskButton} style={iconButtonStyle} data-state={taskWorking ? "working" : "idle"} onClick={() => runAction(task)}><span>{taskWorking ? "Opening…" : task.actionLabel}</span><ShotLabIcon name={taskWorking ? "clock" : "arrow"} size={16} /></button>
            </div>;
          })}
        </div>
      </div>}

      <details className="playerProgressDisclosure" data-testid="player-progress-disclosure" data-command-role="progress-details" data-layout-role="quiet-secondary" open={progressShouldOpen || undefined}>
        <summary><span><small>Progress snapshot</small><strong>{model.daily.pct}% today · {model.weekly.pct}% this week</strong></span><span>View details</span></summary>
        <div className="playerProgressDisclosureBody">
          <div className={styles.momentumSignal}>
            <ExperienceSignal eyebrow="Momentum" title={momentumTitle} detail={momentumDetail} tone={momentumTone} testId="player-daily-momentum-signal">
              <ExperienceProgressRing value={model.daily.makes} max={model.daily.goal || 1} label="Today" detail={`${model.daily.makes} of ${model.daily.goal} makes`} size={88} testId="player-daily-progress-ring" />
            </ExperienceSignal>
          </div>
          <div className={styles.metrics} aria-label="Supporting player metrics">
            <div className={styles.metric}><div className={styles.metricValue}>{rankLabel(model.leaderboardRank)}</div><div className={styles.metricLabel}>Team rank</div></div>
            <div className={styles.metric}><div className={styles.metricValue}>{model.actionableCount}</div><div className={styles.metricLabel}>Open actions</div></div>
          </div>
        </div>
      </details>

      {!model.activation.complete && <details className={styles.activation} data-testid="player-activation-loop" data-command-role="activation" data-layout-role="quiet-secondary" open={model.activation.completeCount < 2}>
        <summary>First-week activation · {model.activation.completeCount}/{model.activation.total} complete</summary>
        <div className={styles.activationRows}>{model.activation.steps.map((step) => <div className={styles.activationRow} key={step.id}>
          <span className={`${styles.activationDot} ${step.done ? styles.activationDotDone : ""}`} aria-hidden="true"><ShotLabIcon name={step.done ? "verified" : "neutral"} size={17} /></span>
          <span className={styles.activationText}>{step.label}</span>
          {!step.done && step.target !== "home" && <button type="button" className={styles.activationButton} style={iconButtonStyle} onClick={() => runAction({ target: step.target, kind: `activation-${step.id}` })}><span>{step.actionLabel || "Do now"}</span><ShotLabIcon name="plus" size={15} /></button>}
        </div>)}</div>
      </details>}
    </section>
  </>);
}
