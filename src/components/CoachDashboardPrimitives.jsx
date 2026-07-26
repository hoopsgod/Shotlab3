import styles from "./CoachDashboardPrimitives.module.css";

const cx = (...values) => values.filter(Boolean).join(" ");

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
    <section className={styles.commandBar} data-testid={testId}>
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

export function InteractiveMetricStrip({ items = [], activeKey, onSelect, testId }) {
  return (
    <div className={styles.metricStrip} data-testid={testId} role="group" aria-label="Dashboard filters">
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            className={cx(styles.metric, active && styles.metricActive, item.tone && styles[`tone_${item.tone}`])}
            aria-pressed={active}
            onClick={() => onSelect?.(item.key)}
          >
            <span className={styles.metricLabel}>{item.label}</span>
            <span className={styles.metricValue}>{item.value}</span>
            {item.detail ? <span className={styles.metricDetail}>{item.detail}</span> : null}
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
}) {
  return (
    <div className={styles.filterRail} data-testid={testId}>
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
      <div className={styles.filterScroller} role="group" aria-label="Dashboard view filters">
        {filters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={cx(styles.filterChip, filter.key === activeFilter && styles.filterChipActive)}
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
  return <div className={styles.insightGrid} data-testid={testId}>{children}</div>;
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
}) {
  return (
    <article className={cx(styles.insightCard, styles[`insight_${tone}`])} data-testid={testId}>
      {eyebrow ? <div className={styles.insightEyebrow}>{eyebrow}</div> : null}
      <h2 className={styles.insightTitle}>{title}</h2>
      {body ? <p className={styles.insightBody}>{body}</p> : null}
      {children ? <div className={styles.insightContent}>{children}</div> : null}
      {(action || secondaryAction) ? (
        <div className={styles.insightActions}>
          {action ? <button type="button" onClick={action.onClick}>{action.label}</button> : null}
          {secondaryAction ? <button type="button" className={styles.quietAction} onClick={secondaryAction.onClick}>{secondaryAction.label}</button> : null}
        </div>
      ) : null}
    </article>
  );
}

export function DashboardSection({ eyebrow, title, summary, action, children, testId, compact = false }) {
  return (
    <section className={cx(styles.section, compact && styles.sectionCompact)} data-testid={testId}>
      <div className={styles.sectionHeader}>
        <div>
          {eyebrow ? <div className={styles.sectionEyebrow}>{eyebrow}</div> : null}
          <h2 className={styles.sectionTitle}>{title}</h2>
          {summary ? <p className={styles.sectionSummary}>{summary}</p> : null}
        </div>
        {action ? <button type="button" className={styles.sectionAction} onClick={action.onClick}>{action.label}</button> : null}
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

export function DashboardProgress({ value = 0, max = 100, label, detail }) {
  const safeMax = Math.max(Number(max) || 0, 1);
  const pct = Math.max(0, Math.min(100, Math.round(((Number(value) || 0) / safeMax) * 100)));
  return (
    <div className={styles.progressBlock}>
      <div className={styles.progressMeta}>
        <span>{label}</span>
        <span>{detail || `${pct}%`}</span>
      </div>
      <div className={styles.progressTrack} aria-label={label} aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100" role="progressbar">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DashboardDetailDrawer({ open, onClose, eyebrow, title, meta, children, testId }) {
  if (!open) return null;
  return (
    <div className={styles.drawerLayer} data-testid={testId}>
      <button type="button" className={styles.drawerBackdrop} aria-label="Close details" onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.drawerHeader}>
          <div>
            {eyebrow ? <div className={styles.eyebrow}>{eyebrow}</div> : null}
            <h2>{title}</h2>
            {meta ? <p>{meta}</p> : null}
          </div>
          <button type="button" className={styles.drawerClose} aria-label="Close details" onClick={onClose}>×</button>
        </div>
        <div className={styles.drawerBody}>{children}</div>
      </aside>
    </div>
  );
}
