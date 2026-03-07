import Button from "./ui/Button";
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
}) {
  const resolvedAccent = ACCENT_MAP[accent] || accent || ACCENT_MAP.lime;
  const actionNode = rightSlot || (actionLabel ? (
    <Button type="button" variant="secondary" className="pageHeaderPill" onClick={onAction}>
      {actionLabel}
    </Button>
  ) : null);

  return (
    <header className="pageHeader" style={{ "--headerAccent": resolvedAccent }}>
      <div className="pageHeaderTop">
        <div className="pageHeaderBadge">{icon}</div>
        <div className="pageHeaderText">
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actionNode ? <div className="pageHeaderRight">{actionNode}</div> : null}
      </div>
      <div className="pageAccentBar" />
    </header>
  );
}
