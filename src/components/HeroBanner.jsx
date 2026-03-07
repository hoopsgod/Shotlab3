export default function HeroBanner({ title, subtitle, stats = [] }) {
  return (
    <section
      style={{
        width: "100%",
        background: "linear-gradient(140deg, rgba(200, 255, 0, 0.2) 0%, rgba(200, 255, 0, 0.08) 45%, rgba(12, 17, 22, 1) 100%)",
        border: "1px solid rgba(200, 255, 0, 0.4)",
        borderRadius: 18,
        padding: "16px 14px",
        marginBottom: 20,
        boxShadow: "0 12px 28px rgba(200, 255, 0, 0.14)",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <h2
          style={{
            fontFamily: "'Bebas Neue','Impact','Arial Black',sans-serif",
            color: "#E5E7EB",
            fontSize: 28,
            letterSpacing: 2,
            lineHeight: 1,
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {subtitle ? (
          <p
            style={{
              fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif",
              color: "#B2BBC7",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.03em",
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "rgba(7, 10, 12, 0.88)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: 12,
              padding: "10px 10px",
            }}
          >
            <div
              style={{
                fontFamily: "'Bebas Neue','Impact','Arial Black',sans-serif",
                color: stat.color || "#C8FF1A",
                fontSize: 22,
                letterSpacing: 1,
                lineHeight: 1,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif",
                color: "#8893A3",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1.8,
                marginTop: 4,
                textTransform: "uppercase",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
