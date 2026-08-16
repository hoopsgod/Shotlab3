import { scheduleWorkspaceActionReveal } from "../lib/playerWorkspaceActionRouting.js";
import ShotLabStatePanel from "./ShotLabStatePanel.jsx";
import styles from "./PlayerOperationalWorkspace.module.css";
import hierarchyStyles from "./PlayerMetricHierarchy.module.css";

const MOBILE_OPERATIONAL_COMPOSITION_CSS = `@media(max-width:700px){[data-player-workspace-filter-rail="true"]{justify-content:center}[data-metric-priority]{text-align:center}}`;

function MetricContent({ metric }) {
  return (
    <>
      <span className={styles.metricLabel} data-metric-role="label">{metric.label}</span>
      <span className={styles.metricValue} data-metric-role="value">{metric.value}</span>
      <span className={styles.metricDetail} data-metric-role="detail">{metric.detail}</span>
    </>
  );
}

function resolveWorkspaceSubtitle(model) {
  const subtitle = String(model?.subtitle || "");
  if (model?.id !== "leaderboards" || !/own the top spot/i.test(subtitle)) return subtitle;
  const rankMetric = (model?.metrics || []).find((metric) => metric?.id === "rank");
  const rank = Number(String(rankMetric?.value || "").replace(/\D/g, ""));
  if (!Number.isFinite(rank) || rank <= 1) return subtitle;
  return `You are ranked #${rank}. You are tied on makes with the position ahead.`;
}

export function PlayerWorkspaceCommandBar({ model, onAction, onMetric, activeMetric = "", testId }) {
  if (!model) return null;
  const runAction = (action) => {
    onAction?.(action);
    scheduleWorkspaceActionReveal(action);
  };
  const runMetric = (metric) => {
    onMetric?.(metric);
    if (metric?.action) scheduleWorkspaceActionReveal(metric.action);
  };
  const metrics = model.metrics || [];
  const subtitle = resolveWorkspaceSubtitle(model);

  return (
    <>
      <style>{MOBILE_OPERATIONAL_COMPOSITION_CSS}</style>
      <section className={styles.root} data-testid={testId || `player-workspace-${model.id}`} data-page-hierarchy="editorial">
        <header className={styles.commandBar} data-layout-role="editorial-header">
          <div className={styles.copy}>
            <div className={styles.eyebrow}>{model.eyebrow}</div>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{model.title}</h1>
              <span className={styles.status}>{model.status}</span>
            </div>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          {model.primaryAction && (
            <button type="button" className={styles.primaryAction} onClick={() => runAction(model.primaryAction)}>
              {model.primaryAction.label} →
            </button>
          )}
        </header>
        <div className={`${styles.metrics} ${hierarchyStyles.metricsHierarchy}`} data-layout-role="supporting-evidence" aria-label={`${model.title} metrics`}>
          {metrics.map((metric, index) => {
            const interactive = Boolean(metric?.filter || metric?.action);
            const hierarchyClass = index === 0 ? hierarchyStyles.metricPrimary : hierarchyStyles.metricSupporting;
            const metricClassName = `${styles.metric} ${hierarchyClass} ${interactive ? styles.metricInteractive : ""} ${activeMetric === metric.id ? styles.metricActive : ""}`;
            const metricPriority = index === 0 ? "primary" : "supporting";

            if (!interactive) {
              return (
                <div
                  key={metric.id}
                  className={metricClassName}
                  data-interactive="false"
                  data-metric-priority={metricPriority}
                >
                  <MetricContent metric={metric} />
                </div>
              );
            }

            return (
              <button
                type="button"
                key={metric.id}
                className={metricClassName}
                data-interactive="true"
                data-metric-priority={metricPriority}
                onClick={() => runMetric(metric)}
                aria-pressed={activeMetric === metric.id}
              >
                <MetricContent metric={metric} />
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}

export function PlayerWorkspaceFilterRail({ value = "all", onChange, options = [], ariaLabel = "Workspace filters", testId }) {
  return (
    <div className={styles.filterRail} role="group" aria-label={ariaLabel} data-testid={testId} data-player-workspace-filter-rail="true">
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          className={`${styles.filterButton} ${value === option.value ? styles.filterActive : ""}`}
          onClick={() => onChange?.(option.value)}
          aria-pressed={value === option.value}
        >
          <span>{option.label}</span>
          {option.count !== undefined && <strong>{option.count}</strong>}
        </button>
      ))}
    </div>
  );
}

export function PlayerWorkspaceEmptyState({ title, detail, actionLabel, onAction }) {
  return (
    <div className={styles.emptyState} data-testid="player-workspace-state-shell">
      <ShotLabStatePanel
        state={actionLabel ? "first-use" : "empty"}
        eyebrow={actionLabel ? "Next useful move" : "Current view"}
        title={title}
        detail={detail}
        actionLabel={actionLabel}
        onAction={onAction}
        compact
        testId="player-workspace-empty-state"
      />
    </div>
  );
}
