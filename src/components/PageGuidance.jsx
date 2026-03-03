export default function PageGuidance({ text, accent = "var(--page-accent)", icon }) {
  return (
    <p
      className="pageGuidance"
      style={{
        margin: "10px 0 14px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "#9a9a9a",
        fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif",
        fontSize: "clamp(12px, 2.8vw, 15px)",
        lineHeight: 1.35,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {icon ?? (
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            minWidth: 6,
            borderRadius: 999,
            background: accent,
            boxShadow: `0 0 0 1px color-mix(in srgb, ${accent} 40%, transparent)`,
          }}
        />
      )}
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{text}</span>
    </p>
  );
}
