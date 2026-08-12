import ShotLabIcon from "./ShotLabIcon.jsx";
import styles from "./ShotLabStatePanel.module.css";

const STATE_META = {
  loading: { eyebrow: "Syncing", icon: "clock", title: "Preparing your workspace" },
  empty: { eyebrow: "No current signal", icon: "target", title: "Nothing here yet" },
  "first-use": { eyebrow: "Start here", icon: "plus", title: "Build the first result" },
  success: { eyebrow: "Saved", icon: "verified", title: "Update complete" },
  error: { eyebrow: "Needs attention", icon: "alert", title: "Something needs a retry" },
};

const stateClass = (state) => {
  if (state === "first-use") return styles.firstUse;
  return styles[state] || styles.empty;
};

export default function ShotLabStatePanel({
  state = "empty",
  eyebrow,
  title,
  detail,
  actionLabel,
  onAction,
  compact = false,
  surface = "dark",
  testId,
}) {
  const meta = STATE_META[state] || STATE_META.empty;
  const role = state === "error" ? "alert" : "status";
  const busy = state === "loading";
  const className = [
    styles.root,
    stateClass(state),
    compact ? styles.compact : "",
    surface === "light" ? styles.light : "",
  ].filter(Boolean).join(" ");

  return (
    <section
      className={className}
      role={role}
      aria-live={state === "error" ? "assertive" : "polite"}
      aria-busy={busy || undefined}
      data-state={state}
      data-surface={surface}
      data-testid={testId}
    >
      <div className={styles.iconWell} aria-hidden="true">
        <ShotLabIcon name={meta.icon} size={compact ? 18 : 21} />
      </div>
      <div className={styles.copy}>
        <div className={styles.eyebrow}>{eyebrow || meta.eyebrow}</div>
        <h3 className={styles.title}>{title || meta.title}</h3>
        {detail ? <p className={styles.detail}>{detail}</p> : null}
        {actionLabel && typeof onAction === "function" ? (
          <button type="button" className={styles.action} onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
