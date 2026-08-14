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
  [data-phase2-composition="progress-led-training"]{padding:0 0 8px!important}
  [data-phase2-composition="progress-led-training"]>[data-layout-role="editorial-header"]{display:none!important}
  [data-phase2-composition="progress-led-training"]>[data-command-role="primary"]{display:grid!important;grid-template-columns:minmax(0,1fr) 104px!important;gap:10px 14px!important;min-height:318px!important;margin:0!important;padding:22px 18px 18px!important;border:1px solid rgba(255,255,255,.82)!important;border-radius:30px 30px 30px 10px!important;background:radial-gradient(circle at 96% 4%,rgba(200,255,26,.15),transparent 28%),linear-gradient(145deg,rgba(255,255,255,.98),rgba(242,241,234,.96))!important;box-shadow:0 28px 64px rgba(17,26,33,.16),inset 0 1px rgba(255,255,255,.9)!important;color:#111a21!important}
  [data-phase2-composition="progress-led-training"]>[data-command-role="primary"]:before{opacity:.32!important;background:radial-gradient(ellipse 42% 58% at 101% 50%,transparent 64%,rgba(17,26,33,.13) 65%,transparent 66%),linear-gradient(90deg,transparent 72%,rgba(17,26,33,.09) 72.2%,transparent 72.5%)!important}
  [data-phase2-composition="progress-led-training"]>[data-command-role="primary"]:after{right:-50px!important;bottom:-82px!important;width:190px!important;height:190px!important;background:rgba(200,255,26,.16)!important;filter:blur(30px)!important}
  [data-phase2-composition="progress-led-training"] [data-command-role="primary"]>div:first-child{grid-column:1/-1!important}
  [data-phase2-composition="progress-led-training"] [data-command-role="primary"] h1{grid-column:1;grid-row:2;align-self:end;max-width:7ch!important;margin:4px 0 0!important;color:#111a21!important;font-size:clamp(36px,10vw,42px)!important;font-weight:850!important;line-height:.9!important;letter-spacing:-.064em!important}
  [data-phase2-composition="progress-led-training"] [data-command-role="primary"]>p{grid-column:1;grid-row:3;margin:0!important;color:#58646d!important;font-size:14px!important;line-height:1.42!important}
  [data-phase2-composition="progress-led-training"] [data-testid="player-daily-primary-action"]{grid-column:1/-1!important;min-height:56px!important;margin-top:6px!important;border-radius:18px 18px 18px 7px!important}
  .playerPhase2Gauge{--phase2-progress:0%;position:relative;grid-column:2;grid-row:2/4;align-self:center;width:104px;height:104px;display:grid;place-items:center;border-radius:50%;background:conic-gradient(#9ed200 var(--phase2-progress),rgba(17,26,33,.10) 0);box-shadow:0 16px 34px rgba(17,26,33,.12)}
  .playerPhase2Gauge:before{content:"";position:absolute;inset:9px;border-radius:50%;background:#0b2633;box-shadow:inset 0 1px rgba(255,255,255,.08)}
  .playerPhase2Gauge>span,.playerPhase2Gauge>small{position:absolute;z-index:1;color:#f7fafb;font-family:var(--font-display)}
  .playerPhase2Gauge>span{top:31px;font-size:26px;font-weight:850;letter-spacing:-.055em}.playerPhase2Gauge>span b{color:#c8ff1a;font-size:12px;margin-left:1px}.playerPhase2Gauge>small{top:61px;color:#91a2aa;font-size:9px;font-weight:760;letter-spacing:.12em}
  [data-phase2-composition="progress-led-training"]>[data-testid="player-command-evidence"]{margin-top:14px!important;border:0!important;border-radius:22px 22px 22px 8px!important;background:rgba(255,255,255,.78)!important;box-shadow:0 16px 38px rgba(17,26,33,.07),inset 0 1px rgba(255,255,255,.86)!important}
  [data-phase2-composition="progress-led-training"]>[data-testid="player-coach-priority-signal"]{border-radius:24px 24px 24px 8px!important;background:rgba(255,255,255,.74)!important}
}
@media(max-width:365px){.playerPhase2Gauge{width:92px;height:92px}.playerPhase2Gauge:before{inset:8px}.playerPhase2Gauge>span{top:27px}.playerPhase2Gauge>small{top:55px}[data-phase2-composition="progress-led-training"]>[data-command-role="primary"]{grid-template-columns:minmax(0,1fr) 92px!important}}
@media(max-width:700px) and (prefers-reduced-transparency:reduce){[data-phase2-composition="progress-led-training"]>[data-command-role="primary"],[data-phase2-composition="progress-led-training"]>[data-testid="player-command-evidence"],[data-phase2-composition="progress-led-training"]>[data-testid="player-coach-priority-signal"]{background:#fff!important}}
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
    <section className={styles.root} data-testid="player-daily-command-center" data-phase="phase-2-command-hierarchy" data-page-hierarchy="activation-loop" data-mobile-product-reset="phase-1" data-mobile-visual-system="phase-2" data-phase2-composition="progress-led-training" aria-label="Daily training command center">
      <div className={styles.header} data-layout-role="editorial-header">
        <div className={styles.eyebrow}>{firstSession.pending ? "First session · Create your baseline" : "Today’s focus"}</div>
        <div className={styles.status}>{firstSession.pending ? "Activation" : urgencyLabel(primary.urgency)}</div>
      </div>

      <div className={`${styles.hero} ${dailyComplete ? styles.heroComplete : ""}`} data-command-role="primary" data-layout-role="primary-decision">
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
