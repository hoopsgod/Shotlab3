import AppHeader from "./AppHeader";

const ACCENT_MAP = {
  lime: "var(--text-2)",
  cyan: "var(--text-2)",
  amber: "var(--text-2)",
  blue: "var(--text-2)",
  purple: "var(--text-2)",
};

export default function PageHeader({
  title,
  subtitle,
  icon,
  accent,
  actionLabel,
  onAction,
  rightSlot,
  eyebrow,
  variant = "standard",
}) {
  const resolvedAccent = ACCENT_MAP[accent] || accent || ACCENT_MAP.lime;
  const actionNode = rightSlot || (actionLabel ? (
    <button type="button" className="pageHeaderPill" onClick={onAction}>
      {actionLabel}
    </button>
  ) : null);

  return (
    <AppHeader
      variant={variant}
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      icon={icon}
      rightSlot={actionNode}
      style={{ "--headerAccent": resolvedAccent }}
    />
  );
}
