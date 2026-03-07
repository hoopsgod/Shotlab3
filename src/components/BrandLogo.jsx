export default function BrandLogo({
  logoUrl,
  brandName = "Shotlab",
  compact = false,
}) {
  const markSize = compact ? 28 : 36;
  const textSize = compact ? 12 : 16;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: compact ? 8 : 10 }}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${brandName} logo`}
          style={{
            width: markSize,
            height: markSize,
            borderRadius: 10,
            objectFit: "cover",
            border: "1px solid var(--border-1)",
            background: "var(--surface-2)",
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{
            width: markSize,
            height: markSize,
            borderRadius: 10,
            border: "1px solid var(--border-1)",
            background: "var(--accent)",
            color: "#081006",
            fontSize: compact ? 10 : 12,
            fontWeight: 800,
            letterSpacing: "0.08em",
            display: "grid",
            placeItems: "center",
            textTransform: "uppercase",
          }}
        >
          SL
        </div>
      )}
      <span
        style={{
          fontSize: textSize,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-1)",
          lineHeight: 1,
        }}
      >
        {brandName}
      </span>
    </div>
  );
}
