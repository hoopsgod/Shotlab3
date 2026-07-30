import styles from "./OperationalInsightRail.module.css";

const cx = (...values) => values.filter(Boolean).join(" ");

export default function OperationalInsightRail({ model, onAction, testId }) {
  if (!model) return null;
  return (
    <div className={styles.root} data-testid={testId}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Live decision support</div>
          <h2>{model.title}</h2>
        </div>
        <span className={styles.status}>{model.status}</span>
      </div>
      <div className={styles.context}>Viewing {String(model.activeTab || "home").replace("-", " ")}</div>
      <div className={styles.stack}>
        {(model.items || []).map((item, index) => (
          <article
            key={`${item.eyebrow}-${item.title}`}
            className={cx(styles.card, styles[`tone_${item.tone || "neutral"}`], index === 0 && styles.primaryCard)}
          >
            <div className={styles.cardEyebrow}>{item.eyebrow}</div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
            {item.action ? (
              <button type="button" onClick={() => onAction?.(item.action)}>
                {item.actionLabel || item.action.label || "Open"} <span aria-hidden="true">→</span>
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
