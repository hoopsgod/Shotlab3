import styles from "./ShotLabPerformanceMark.module.css";

const cx = (...values) => values.filter(Boolean).join(" ");

const normalizeKind = (kind) => ["rank", "streak", "pb", "milestone", "delta"].includes(kind) ? kind : "milestone";

function MarkGeometry({ kind }) {
  if (kind === "rank") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="24"/><path d="M12 32h8M44 32h8M32 12v8M32 44v8"/><circle cx="32" cy="32" r="12"/></svg>;
  }
  if (kind === "streak") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M34 8c3 11-5 14-5 23 0 4 2 7 5 9-1-8 7-10 9-19 7 8 10 15 9 22-1 9-9 15-20 15S13 51 13 41c0-8 5-14 12-20 1 7 4 10 9 11-3-8 4-13 0-24Z"/><path d="M24 47c3 5 13 6 17-1"/></svg>;
  }
  if (kind === "pb") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="23"/><circle cx="32" cy="32" r="12"/><circle cx="32" cy="32" r="3"/><path d="M32 4v8M32 52v8M4 32h8M52 32h8"/></svg>;
  }
  if (kind === "delta") {
    return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 45 27 30l9 9 16-19"/><path d="M42 20h10v10"/><path d="M12 53h40"/></svg>;
  }
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6 52 16v15c0 13-8 22-20 27C20 53 12 44 12 31V16Z"/><path d="M22 33 29 40 43 24"/></svg>;
}

export default function ShotLabPerformanceMark({
  kind = "milestone",
  value,
  label,
  detail,
  compact = false,
  surface = "dark",
  tone = "accent",
  className = "",
  testId,
}) {
  const resolvedKind = normalizeKind(kind);
  const aria = [label, value, detail].filter(Boolean).join(": ");
  return (
    <div
      className={cx(styles.root, styles[resolvedKind], styles[`surface_${surface}`], styles[`tone_${tone}`], compact && styles.compact, className)}
      data-testid={testId}
      data-performance-kind={resolvedKind}
      aria-label={aria || "Performance mark"}
    >
      <div className={styles.glyph}>
        <MarkGeometry kind={resolvedKind} />
        <strong>{value}</strong>
      </div>
      {(label || detail) ? <div className={styles.copy}>
        {label ? <span>{label}</span> : null}
        {detail ? <small>{detail}</small> : null}
      </div> : null}
    </div>
  );
}
