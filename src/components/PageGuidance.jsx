export default function PageGuidance({ text, accent = "var(--page-accent)", icon }) {
  return (
    <p className="pageGuidance" style={{ "--guidanceAccent": accent }}>
      {icon ?? <span className="pageGuidanceDot" aria-hidden="true" />}
      <span className="pageGuidanceText">{text}</span>
    </p>
  );
}
