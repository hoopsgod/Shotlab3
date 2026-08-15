import ShotLabIcon from "./ShotLabIcon.jsx";
import styles from "./CoachRoutePerformanceStage.module.css";
import "./CoachInteractiveDashboards.css";

const ROUTE_ICONS = {
  players: "team",
  schedule: "calendar",
  training: "training",
  strength: "strength",
  activity: "activity",
  leaderboards: "trophy",
  settings: "settings",
  default: "target",
};

const cx = (...values) => values.filter(Boolean).join(" ");

const classifyRouteValue = (value = "") => {
  const normalized = String(value).toLowerCase();
  if (normalized.includes("leader") || normalized.includes("rank")) return "leaderboards";
  if (normalized.includes("event") || normalized.includes("schedule") || normalized.includes("calendar")) return "schedule";
  if (normalized.includes("drill") || normalized.includes("training")) return "training";
  if (normalized.includes("strength") || normalized.includes("lifting") || normalized.includes("conditioning")) return "strength";
  if (normalized.includes("activity") || normalized.includes("signal")) return "activity";
  if (normalized.includes("player") || normalized.includes("roster")) return "players";
  if (normalized.includes("account") || normalized.includes("setting")) return "settings";
  return "default";
};

export const resolveCoachRouteKind = ({ testId = "", title = "" } = {}) => {
  const routeKind = classifyRouteValue(testId);
  return routeKind === "default" ? classifyRouteValue(title) : routeKind;
};

const readableMetricValue = (metric) => {
  const value = metric?.value;
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

function StageMetric({ metric, active, onSelect }) {
  const interactive = Boolean(onSelect && metric?.key);
  const Component = interactive ? "button" : "div";
  const props = interactive
    ? {
        type: "button",
        onClick: () => onSelect(metric.key),
        "aria-pressed": active,
        "aria-label": `${metric.label}: ${readableMetricValue(metric)}${metric.detail ? ` · ${metric.detail}` : ""}`,
      }
    : {};

  return (
    <Component
      {...props}
      className={cx(styles.metric, active && styles.metricActive)}
      data-route-stage-metric
    >
      <span className={styles.metricLabel}>{metric.displayLabel || metric.label}</span>
      <span className={styles.metricValue}>{readableMetricValue(metric)}</span>
      {metric.detail ? <span className={styles.metricDetail}>{metric.detail}</span> : null}
    </Component>
  );
}

export default function CoachRoutePerformanceStage({
  kind,
  eyebrow,
  title,
  detail,
  tone = "info",
  action,
  metrics = [],
  activeMetric,
  onMetricSelect,
  children,
  testId,
}) {
  const routeKind = kind || resolveCoachRouteKind({ testId, title });
  const icon = ROUTE_ICONS[routeKind] || ROUTE_ICONS.default;
  const visibleMetrics = metrics.filter(Boolean).slice(0, 4);

  return (
    <section
      className={styles.stage}
      data-testid={testId}
      data-surface="dark"
      data-visual-role="primary-decision"
      data-route-kind={routeKind}
      data-tone={tone}
    >
      <div className={styles.watermark} aria-hidden="true">
        <ShotLabIcon name={icon} size={118} />
      </div>

      <div className={styles.topline}>
        <span className={styles.routeMark} aria-hidden="true">
          <ShotLabIcon name={icon} size={20} />
        </span>
        <span className={styles.eyebrow}>{eyebrow || "Coach decision"}</span>
      </div>

      <div className={styles.copy}>
        <div className={styles.title} role="heading" aria-level="2">{title}</div>
        {detail ? <div className={styles.detail}>{detail}</div> : null}
        {action ? (
          <button type="button" className={styles.action} data-action-role="primary" onClick={action.onClick} disabled={action.disabled}>
            <span>{action.label}</span>
            <ShotLabIcon name="arrow" size={15} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {children ? <div className={styles.visual} data-visual-role="decision-evidence">{children}</div> : null}

      {visibleMetrics.length ? (
        <div className={styles.metricRail} data-visual-role="performance-evidence" aria-label="Current performance signals">
          {visibleMetrics.map((metric) => (
            <StageMetric
              key={metric.key || metric.label}
              metric={metric}
              active={metric.key === activeMetric}
              onSelect={onMetricSelect}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
