import React from "react";

export default function DrillDetail({ title, description, videoUrl, techniqueTips = [] }) {
  return (
    <article
      style={{
        background: "rgba(12,17,22,0.9)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "#B8FF00", fontWeight: 700 }}>DRILL BREAKDOWN</div>
      <h3 style={{ margin: "6px 0 8px", color: "#E5E7EB", fontSize: 18 }}>{title}</h3>
      <p style={{ margin: "0 0 10px", color: "#B2BBC7", fontSize: 13, lineHeight: 1.5 }}>{description}</p>

      <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)" }}>
        <iframe
          title={`${title} instructional video`}
          src={videoUrl}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "#8893A3", fontSize: 12, lineHeight: 1.5 }}>
        {techniqueTips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </article>
  );
}
