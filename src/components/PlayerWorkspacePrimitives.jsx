import styles from "./PlayerWorkspacePrimitives.module.css";

const safeItems = (items) => (Array.isArray(items) ? items.filter(Boolean) : []);

export function PlayerWorkspaceHeader({ eyebrow = "Player workspace", title, subtitle, actionLabel, onAction, status }) {
  return (
    <section className={styles.header} data-testid="player-workspace-header">
      <div className={styles.headerCopy}>
        <div className={styles.eyebrow}>{eyebrow}</div>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{title}</h1>
          {status && <span className={styles.status}>{status}</span>}
        </div>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actionLabel && (
        <button type="button" className={styles.primaryAction} onClick={onAction}>
          {actionLabel} →
        </button>
      )}
    </section>
  );
}

export function PlayerMetricStrip({ items = [], activeKey, onSelect, ariaLabel = "Player workspace metrics" }) {
  const metrics = safeItems(items).slice(0, 4);
  return (
    <div className={styles.metrics} aria-label={ariaLabel} data-testid="player-workspace-metrics">
      {metrics.map((item) => {
        const active = activeKey === item.key;
        return (
          <button
            type="button"
            key={item.key || item.label}
            className={`${styles.metric} ${active ? styles.metricActive : ""}`}
            onClick={() => onSelect?.(item.key)}
            aria-pressed={active}
          >
            <span className={styles.metricValue}>{item.value}</span>
            <span className={styles.metricLabel}>{item.label}</span>
            {item.detail && <span className={styles.metricDetail}>{item.detail}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function PlayerInsightPanel({ title, detail, actionLabel, onAction, tone = "default", children }) {
  return (
    <section className={`${styles.insight} ${styles[`insight_${tone}`] || ""}`} data-testid="player-workspace-insight">
      <div>
        <div className={styles.insightTitle}>{title}</div>
        {detail && <div className={styles.insightDetail}>{detail}</div>}
      </div>
      {children}
      {actionLabel && (
        <button type="button" className={styles.secondaryAction} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </section>
  );
}

export function PlayerOperationalList({ rows = [], emptyTitle = "Nothing needs attention", emptyDetail = "You are caught up.", renderRow }) {
  const safeRows = safeItems(rows);
  if (!safeRows.length) {
    return (
      <div className={styles.empty} data-testid="player-workspace-empty">
        <div className={styles.emptyTitle}>{emptyTitle}</div>
        <div className={styles.emptyDetail}>{emptyDetail}</div>
      </div>
    );
  }
  return <div className={styles.list} data-testid="player-workspace-list">{safeRows.map(renderRow)}</div>;
}
