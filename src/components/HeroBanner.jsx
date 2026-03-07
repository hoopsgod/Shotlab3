function HeroBanner({ title, subtitle, stats = [] }) {
  return (
    <section
      style={{
        width: "100%",
        borderRadius: 18,
        padding: "22px 20px",
        marginBottom: 18,
        border: "1px solid rgba(200,255,26,0.26)",
        background:
          "linear-gradient(135deg, rgba(200,255,26,0.16) 0%, rgba(12,17,22,0.96) 52%, rgba(12,17,22,1) 100%)",
        boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
      }}
    >
      <h1
        className="u-allcaps-long"
        style={{
          margin: 0,
          fontSize: "clamp(1.8rem, 3vw, 2.7rem)",
          lineHeight: 1.02,
          color: "var(--text-1)",
        }}
      >
        {title}
      </h1>

      <p
        style={{
          margin: "10px 0 16px",
          color: "var(--text-2)",
          fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif",
          fontSize: 13,
          lineHeight: 1.45,
        }}
      >
        {subtitle}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 8,
        }}
      >
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="card card--list"
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              minHeight: 70,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background: "rgba(10, 15, 20, 0.82)",
            }}
          >
            <span
              style={{
                fontSize: 24,
                lineHeight: 1,
                color: stat.color || "var(--text-1)",
                fontFamily: "'Bebas Neue','Impact','Arial Black',sans-serif",
                letterSpacing: "0.04em",
              }}
            >
              {stat.value}
            </span>
            <span
              className="u-meta-label"
              style={{
                fontSize: 10,
                color: "var(--text-2)",
              }}
            >
              {stat.label}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HeroBanner;
