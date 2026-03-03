const ACCENT_MAP = {
  lime: "#B8FF00",
  cyan: "#38E8FF",
  amber: "#FFC400",
  blue: "#5B7CFF",
  purple: "#B86CFF",
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
    <button type="button" className="pageHeaderPill btn-text" onClick={onAction}>
      {actionLabel}
    </button>
  ) : null);

  return (
    <header className="pageHeader" style={{ "--headerAccent": resolvedAccent }}>
      <div className="pageHeaderTop">
        <div className="pageHeaderBadge">{icon}</div>
        <div className="pageHeaderText">
          <h1 className="type-h1">{title}</h1>
          {subtitle ? <p className="type-sub">{subtitle}</p> : null}
        </div>
        {actionNode ? <div className="pageHeaderRight">{actionNode}</div> : null}
      </div>
      <div className="pageAccentBar" />
    </header>
  );
}
