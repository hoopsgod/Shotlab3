import { createPortal } from "react-dom";
import ShotLabIcon from "./ShotLabIcon";
import styles from "./CoachDashboardPrimitives.module.css";
import "./Phase2PremiumMetricLayer.css";

const cx = (...values) => values.filter(Boolean).join(" ");

const metricIconName = (item = {}) => {
  if (item.icon) return item.icon;
  const value = `${item.key || ""} ${item.label || ""}`.toLowerCase();
  if (value.includes("roster") || value.includes("player")) return "team";
  if (value.includes("active") || value.includes("completed")) return "check";
  if (value.includes("attention") || value.includes("missing") || value.includes("awaiting")) return "alert";
  if (value.includes("response") || value.includes("rate")) return "chart";
  if (value.includes("upcoming") || value.includes("event")) return "calendar";
  if (value.includes("make") || value.includes("shot")) return "target";
  return "momentum";
};

const metricEvidencePoints = (values = []) => {
  const numeric = values.map((value) => Number(value)).filter(Number.isFinite).slice(0, 10);
  if (numeric.length < 2) return null;
  const min = Math.min(...numeric);
  const max = Math.max(...numeric);
  const flat = max === min;
  return numeric.map((value, index) => {
    const x = numeric.length === 1 ? 50 : (index / (numeric.length - 1)) * 100;
    const y = flat ? 14 : 24 - ((value - min) / (max - min)) * 18;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
};

function PremiumMetricEvidence({ values, label }) {
  const points = metricEvidencePoints(values);
  if (!points) {
    return (
      <span data-premium-metric-evidence data-premium-metric-placeholder role="img" aria-label={`${label || "Recent metric signal"}: no trend series available`}>
        <svg viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
          <line data-premium-metric-path x1="0" y1="22" x2="100" y2="22" />
        </svg>
      </span>
    );
  }
  return (
    <span data-premium-metric-evidence role="img" aria-label={label || "Recent metric signal"}>
      <svg viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
        <line data-premium-metric-baseline x1="0" y1="24" x2="100" y2="24" />
        <polyline data-premium-metric-path points={points} />
      </svg>
    </span>
  );
}

export function DashboardCommandBar({
  eyebrow,
  title,
  summary,
  status,
  actions = [],
  children,
  testId,
}) {
  return (
    <section className={styles.commandBar} data-testid={testId} data-surface="dark" data-visual-role="command-bar">
      <div className={styles.commandCopy}>
        {eyebrow ? <div className={styles.eyebrow}>{eyebrow}</div> : null}
        <div className={styles.commandTitleRow}>
          <h1 className={styles.commandTitle}>{title}</h1>
          {status ? <span className={styles.status}>{status}</span> : null}
        </div>
        {summary ? <p className={styles.commandSummary}>{summary}</p> : null}
      </div>
      {actions.length ? (
        <div className={styles.commandActions}>
          {actions.map((action, index) => (
            <button
              key={action.key || action.label}
              type="button"
              className={cx(styles.commandAction, index === 0 && styles.primaryAction, action.danger && styles.dangerAction)}
              data-action-role={action.danger ? "destructive" : index === 0 ? "primary" : "secondary"}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon ? <span className={styles.actionIcon}>{action.icon}</span> : null}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      ) : null}
      {children ? <div className={styles.commandChildren}>{children}</div> : null}
    </section>
  );
}

export function InteractiveMetricStrip({ items = [], activeKey, onSelect, testId, surface = "dark" }) {
  return (
    <div className={styles.metricStrip} data-testid={testId} data-surface={surface} data-visual-role="metric-strip" role="group" aria-label="Dashboard filters">
      {items.map((item) => {
        const active = item.key === activeKey;
        const accessibleLabel = `${item.label}: ${item.value}${item.detail ? ` · ${item.detail}` : ""}`;
        return (
          <button
            key={item.key}
            type="button"
            className={cx(styles.metric, active && styles.metricActive, item.tone && styles[`tone_${item.tone}`])}
            aria-label={item.ariaLabel || accessibleLabel}
            aria-pressed={active}
            onClick={() => onSelect?.(item.key)}
            data-premium-metric
            data-premium-metric-tone={item.tone || "neutral"}
          >
            <span data-premium-metric-head-shell>
              <span data-premium-metric-head>
                <span data-premium-metric-icon aria-hidden="true"><ShotLabIcon name={metricIconName(item)} size={15} /></span>
                <small data-premium-metric-label>{item.displayLabel || item.label}</small>
              </span>
            </span>
            <span data-premium-metric-readout>
              <output data-premium-metric-value>{item.value}</output>
            </span>
            <span data-premium-metric-foot>
              {item.detail ? <span className={styles.metricDetail} data-premium-metric-detail>{item.detail}</span> : null}
              <PremiumMetricEvidence values={item.evidence} label={item.evidenceLabel || `${item.label} recent signal`} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function DashboardFilterRail({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search",
  filters = [],
  activeFilter,
  onFilterChange,
  trailing,
  testId,
  surface = "dark",
  wrapFilters = false,
}) {
  return (
    <div className={styles.filterRail} data-testid={testId} data-surface={surface} data-visual-role="filter-rail">
      <label className={styles.searchField}>
        <span className={styles.srOnly}>Search dashboard</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.6-3.6" />
        </svg>
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </label>
      <div
        className={styles.filterScroller}
        role="group"
        aria-label="Dashboard view filters"
        style={wrapFilters ? { flexWrap: "wrap", overflowX: "visible" } : undefined}
      >
        {filters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={cx(styles.filterChip, filter.key === activeFilter && styles.filterChipActive)}
            data-coach-filter-chip
            style={{ minHeight: 44, boxSizing: "border-box", touchAction: "manipulation" }}
            aria-pressed={filter.key === activeFilter}
            onClick={() => onFilterChange?.(filter.key)}
          >
            {filter.label}
            {filter.count !== undefined ? <span>{filter.count}</span> : null}
          </button>
        ))}
      </div>
      {trailing ? <div className={styles.filterTrailing}>{trailing}</div> : null}
    </div>
  );
}

export function DashboardInsightGrid({ children, testId }) {
  return <div className={styles.insightGrid} data-testid={testId} data-visual-role="insight-grid">{children}</div>;
}

export function DashboardInsightCard({
  eyebrow,
  title,
  body,
  tone = "neutral",
  action,
  secondaryAction,
  children,
  testId,
  surface = "dark",
}) {
  return (
    <article className={cx(styles.insightCard, styles[`insight_${tone}`])} data-testid={testId} data-surface={surface} data-visual-role="insight-card">
      {eyebrow ? <div className={styles.insightEyebrow}>{eyebrow}</div> : null}
      <h2 className={styles.insightTitle}>{title}</h2>
      {body ? <p className={styles.insightBody}>{body}</p> : null}
      {children ? <div className={styles.insightContent}>{children}</div> : null}
      {(action || secondaryAction) ? (
        <div className={styles.insightActions} data-visual-role="insight-actions">
          {action ? <button type="button" data-action-role="secondary" onClick={action.onClick}>{action.label}</button> : null}
          {secondaryAction ? <button type="button" className={styles.quietAction} data-action-role="tertiary" onClick={secondaryAction.onClick}>{secondaryAction.label}</button> : null}
        </div>
      ) : null}
    </article>
  );
}

export function DashboardSection({ eyebrow, title, summary, action, children, testId, compact = false, surface = "dark" }) {
  return (
    <section className={cx(styles.section, compact && styles.sectionCompact)} data-testid={testId} data-surface={surface} data-visual-role="dashboard-section">
      <div className={styles.sectionHeader}>
        <div>
          {eyebrow ? <div className={styles.sectionEyebrow}>{eyebrow}</div> : null}
          <h2 className={styles.sectionTitle}>{title}</h2>
          {summary ? <p className={styles.sectionSummary}>{summary}</p> : null}
        </div>
        {action ? <button type="button" className={styles.sectionAction} data-action-role="secondary" onClick={action.onClick}>{action.label}</button> : null}
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

export function DashboardProgress({ value = 0, max = 100, label, detail }) {
  const safeMax = Math.max(Number(max) || 0, 1);
  const pct = Math.max(0, Math.min(100, Math.round(((Number(value) || 0) / safeMax) * 100)));
  return (
    <div className={styles.progressBlock} data-visual-role="progress-block">
      <div className={styles.progressMeta} data-visual-role="progress-meta">
        <span>{label}</span>
        <span>{detail || `${pct}%`}</span>
      </div>
      <div className={styles.progressTrack} data-visual-role="progress-track" aria-label={label} aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100" role="progressbar">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DashboardDetailDrawer({ open, onClose, eyebrow, title, meta, children, testId }) {
  if (!open) return null;
  const drawer = (
    <div className={styles.drawerLayer} data-testid={testId}>
      <button type="button" className={styles.drawerBackdrop} aria-label="Close details" onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label={title} data-surface="dark" data-visual-role="detail-drawer">
        <div className={styles.drawerHeader}>
          <div>
            {eyebrow ? <div className={styles.eyebrow}>{eyebrow}</div> : null}
            <h2>{title}</h2>
            {meta ? <p>{meta}</p> : null}
          </div>
          <button type="button" className={styles.drawerClose} data-action-role="tertiary" aria-label="Close details" onClick={onClose}>×</button>
        </div>
        <div className={styles.drawerBody}>{children}</div>
      </aside>
    </div>
  );
  return typeof document !== "undefined" && document.body
    ? createPortal(drawer, document.body)
    : drawer;
}
