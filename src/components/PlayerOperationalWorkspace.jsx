import { scheduleWorkspaceActionReveal } from "../lib/playerWorkspaceActionRouting.js";
import styles from "./PlayerOperationalWorkspace.module.css";
import hierarchyStyles from "./PlayerMetricHierarchy.module.css";

function MetricContent({ metric }) {
  return (
    <>
      <span className={styles.metricLabel}>{metric.label}</span>
      <span className={styles.metricValue}>{metric.value}</span>
      <span className={styles.metricDetail}>{metric.detail}</span>
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
    <section className={styles.root} data-testid={testId || `player-workspace-${model.id}`}>
      <div className={styles.commandBar}>
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
      </div>
      <div className={`${styles.metrics} ${hierarchyStyles.metricsHierarchy}`} aria-label={`${model.title} metrics`}>
        {metrics.map((metric, index) => {
          const interactive = Boolean(metric?.filter || metric?.action);
          const hierarchyClass = index === 0 ? hierarchyStyles.metricPrimary : hierarchyStyles.metricSupporting;
          const metricClassName = `${styles.metric} ${hierarchyClass} ${interactive ? styles.metricInteractive : styles.metricStatic} ${activeMetric === metric.id ? styles.metricActive : ""}`;
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
  );
}

export function PlayerWorkspaceFilterRail({ value = "all", onChange, options = [], ariaLabel = "Workspace filters", testId }) {
  return (
    <div className={styles.filterRail} role="group" aria-label={ariaLabel} data-testid={testId}>
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
    <div className={styles.emptyState}>
      <div className={styles.emptyTitle}>{title}</div>
      <div className={styles.emptyDetail}>{detail}</div>
      {actionLabel && <button type="button" onClick={onAction}>{actionLabel} →</button>}
    </div>
  );
}
