export default function PageHeader({ title, subtitle, icon, accent, rightSlot }) {
  return (
    <header className="pageHeader" style={{ "--headerAccent": accent }}>
      <div className="pageHeaderTop">
        <div className="pageHeaderBadge">{icon}</div>
        <div className="pageHeaderText">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {rightSlot ? <div className="pageHeaderRight">{rightSlot}</div> : null}
      </div>
      <div className="pageAccentBar" />
    </header>
  );
}
