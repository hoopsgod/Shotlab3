import { scheduleWorkspaceActionReveal } from "../lib/playerWorkspaceActionRouting.js";
import ShotLabStatePanel from "./ShotLabStatePanel.jsx";
import TeamIdentityTitleStage from "./TeamIdentityTitleStage.jsx";
import styles from "./PlayerOperationalWorkspace.module.css";
import hierarchyStyles from "./PlayerMetricHierarchy.module.css";

function MetricContent({ metric }) {
  return <><span className={styles.metricLabel} data-metric-role="label">{metric.label}</span><span className={styles.metricValue} data-metric-role="value">{metric.value}</span><span className={styles.metricDetail} data-metric-role="detail">{metric.detail}</span></>;
}

function resolveWorkspaceSubtitle(model) {
  const subtitle = String(model?.subtitle || "");
  if (model?.id !== "leaderboards" || !/own the top spot/i.test(subtitle)) return subtitle;
  const rankMetric = (model?.metrics || []).find((metric) => metric?.id === "rank");
  const rank = Number(String(rankMetric?.value || "").replace(/\D/g, ""));
  if (!Number.isFinite(rank) || rank <= 1) return subtitle;
  return `You are ranked #${rank}. You are tied on makes with the position ahead.`;
}

function resolveWorkspaceIdentityLabel(model) {
  const labels = { "at-home": "Player", program: "Program", events: "Schedule", strength: "Physical Development", leaderboards: "Compete", profile: "Development" };
  return labels[model?.id] || model?.eyebrow || "Player";
}

export function PlayerWorkspaceCommandBar({ model, onAction, onMetric, activeMetric = "", backAction = null, titleSize = "auto", testId }) {
  if (!model) return null;
  const runAction = (action) => { onAction?.(action); scheduleWorkspaceActionReveal(action); };
  const runMetric = (metric) => { onMetric?.(metric); if (metric?.action) scheduleWorkspaceActionReveal(metric.action); };
  const metrics = model.metrics || [];
  const subtitle = resolveWorkspaceSubtitle(model);
  const primaryAction = model.primaryAction ? [{ key: `workspace-${model.id}-primary`, label: model.primaryAction.label, onClick: () => runAction(model.primaryAction), ariaLabel: model.primaryAction.label }] : [];

  return <section className={styles.root} data-testid={testId || `player-workspace-${model.id}`} data-page-hierarchy="editorial" data-team-workspace={model.id} data-title-stage-family="editorial">
    <div className="teamIdentityTitleStageFrame" data-layout-role="title-and-operations">
      <TeamIdentityTitleStage
        variant="standard"
        surface="light"
        role={resolveWorkspaceIdentityLabel(model)}
        title={model.title}
        summary={subtitle}
        status={model.status}
        actions={primaryAction}
        backAction={backAction}
        titleSize={titleSize}
        brandTreatment="compact"
        testId={`${testId || `player-workspace-${model.id}`}-title-stage`}
        className={styles.teamTitleStage || ""}
        dataLayoutRole="editorial-header"
        dataVisualRole="player-team-workspace-title"
        dataPageKind={model.id}
        dataMobileStage="editorial"
        ariaLabel={`${model.title} team identity and page title`}
      />
    </div>
    <div className={`${styles.metrics} ${hierarchyStyles.metricsHierarchy}`} data-layout-role="supporting-evidence" aria-label={`${model.title} metrics`}>
      {metrics.map((metric, index) => {
        const interactive = Boolean(metric?.filter || metric?.action);
        const hierarchyClass = index === 0 ? hierarchyStyles.metricPrimary : hierarchyStyles.metricSupporting;
        const metricClassName = `${styles.metric} ${hierarchyClass} ${interactive ? styles.metricInteractive : ""} ${activeMetric === metric.id ? styles.metricActive : ""}`;
        const metricPriority = index === 0 ? "primary" : "supporting";
        if (!interactive) return <div key={metric.id} className={metricClassName} data-interactive="false" data-metric-priority={metricPriority}><MetricContent metric={metric} /></div>;
        return <button type="button" key={metric.id} className={metricClassName} data-interactive="true" data-metric-priority={metricPriority} onClick={() => runMetric(metric)} aria-pressed={activeMetric === metric.id}><MetricContent metric={metric} /></button>;
      })}
    </div>
  </section>;
}

export function PlayerWorkspaceFilterRail({ value = "all", onChange, options = [], ariaLabel = "Workspace filters", testId }) {
  return <div className={styles.filterRail} role="group" aria-label={ariaLabel} data-testid={testId} data-player-workspace-filter-rail="true">{options.map((option) => <button type="button" key={option.value} className={`${styles.filterButton} ${value === option.value ? styles.filterActive : ""}`} onClick={() => onChange?.(option.value)} aria-pressed={value === option.value}><span>{option.label}</span>{option.count !== undefined && <strong>{option.count}</strong>}</button>)}</div>;
}

export function PlayerWorkspaceEmptyState({ title, detail, actionLabel, onAction }) {
  return <div className={styles.emptyState} data-testid="player-workspace-state-shell"><ShotLabStatePanel state={actionLabel ? "first-use" : "empty"} eyebrow={actionLabel ? "Next useful move" : "Current view"} title={title} detail={detail} actionLabel={actionLabel} onAction={onAction} compact testId="player-workspace-empty-state" /></div>;
}
