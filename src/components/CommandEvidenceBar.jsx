import styles from "./CommandEvidenceBar.module.css";

const safeItems = (items) => (Array.isArray(items) ? items.filter(Boolean).slice(0, 4) : []);

export default function CommandEvidenceBar({
  items = [],
  ariaLabel = "Command evidence",
  testId,
  tone = "dark",
}) {
  const resolvedItems = safeItems(items);
  if (!resolvedItems.length) return null;

  return (
    <div
      className={styles.root}
      data-tone={tone}
      data-testid={testId}
      aria-label={ariaLabel}
      style={{ "--evidence-count": resolvedItems.length }}
    >
      {resolvedItems.map((item, index) => {
        const content = (
          <>
            <span className={styles.value}>
              {item.value}
              {item.suffix ? <small>{item.suffix}</small> : null}
            </span>
            <span className={styles.label}>{item.label}</span>
            {Number.isFinite(Number(item.progress)) ? (
              <span className={styles.track} aria-hidden="true">
                <span style={{ width: `${Math.max(0, Math.min(100, Number(item.progress)))}%` }} />
              </span>
            ) : null}
          </>
        );

        if (typeof item.onClick === "function") {
          return (
            <button
              key={item.id || item.label || index}
              type="button"
              className={styles.item}
              onClick={item.onClick}
              aria-label={item.ariaLabel || `${item.label}: ${item.value}${item.suffix || ""}`}
            >
              {content}
            </button>
          );
        }

        return <div key={item.id || item.label || index} className={styles.item}>{content}</div>;
      })}
    </div>
  );
}
