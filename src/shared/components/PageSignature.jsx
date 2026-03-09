import styles from "./PageSignature.module.css";

function SignatureIcon({ icon }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (icon) {
    case "feed":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "drills":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M7.5 16.5l9-9" />
          <path d="M9.5 8.5h.01" />
          <path d="M14.5 15.5h.01" />
        </svg>
      );
    case "events":
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M8 3.5v3" />
          <path d="M16 3.5v3" />
          <path d="M3 10h18" />
        </svg>
      );
    case "strength":
      return (
        <svg {...common}>
          <path d="M4 10v4" />
          <path d="M7 8v8" />
          <path d="M17 8v8" />
          <path d="M20 10v4" />
          <path d="M7 12h10" />
        </svg>
      );
    case "players":
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="3" />
          <circle cx="16.5" cy="10" r="2.5" />
          <path d="M3.8 19a5.6 5.6 0 0 1 10.4 0" />
          <path d="M14 19a4.5 4.5 0 0 1 6.2-.4" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

export default function PageSignature({
  title,
  subtitle,
  accent = "#b6aa94",
  icon = "feed",
  rightActionLabel,
  onRightAction,
}) {
  const hasRightAction = typeof rightActionLabel === "string" && rightActionLabel.trim().length > 0;

  return (
    <header className={styles.root} style={{ "--signature-accent": accent }}>
      <div className={styles.topRow}>
        <div className={styles.badge}>
          <SignatureIcon icon={icon} />
        </div>

        <div className={styles.text}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        {hasRightAction ? (
          <button
            type="button"
            className={styles.rightAction}
            onClick={onRightAction}
            disabled={typeof onRightAction !== "function"}
          >
            {rightActionLabel}
          </button>
        ) : null}
      </div>

      <div className={styles.underline} />
    </header>
  );
}
