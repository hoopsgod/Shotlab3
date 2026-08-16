import styles from "./SecondaryPageDisclosure.module.css";

export default function SecondaryPageDisclosure({
  title,
  summary,
  children,
  defaultOpen = false,
  testId,
}) {
  return (
    <details
      className={styles.disclosure}
      open={defaultOpen}
      data-testid={testId}
      data-surface="light"
      data-visual-role="progressive-disclosure"
    >
      <summary className={styles.summary} data-visual-role="disclosure-summary">
        <span className={styles.copy}>
          <span className={styles.title} data-visual-role="disclosure-title">{title}</span>
          {summary ? <span className={styles.meta} data-visual-role="disclosure-meta">{summary}</span> : null}
        </span>
        <span className={styles.chevron} data-visual-role="disclosure-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className={styles.body} data-visual-role="disclosure-body">{children}</div>
    </details>
  );
}
