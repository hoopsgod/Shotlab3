import React from "react";
import UI_TOKENS from "../styles/tokens";

const DRILL_DETAIL_STYLE = {
  background: "rgba(12,17,22,0.9)",
  border: `1px solid ${UI_TOKENS.borders.subtle}`,
  borderRadius: UI_TOKENS.radii.lg,
  padding: UI_TOKENS.radii.lg,
  marginBottom: UI_TOKENS.spacing.md,
};

export default function DrillDetail({ title, description, videoUrl, techniqueTips = [] }) {
  return (
    <article style={DRILL_DETAIL_STYLE}>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", color: UI_TOKENS.colors.primary, fontWeight: 700 }}>DRILL BREAKDOWN</div>
      <h3 style={{ margin: "6px 0 8px", color: UI_TOKENS.colors.textPrimary, fontSize: 18 }}>{title}</h3>
      <p style={{ margin: "0 0 10px", color: UI_TOKENS.colors.textSecondary, fontSize: 13, lineHeight: 1.5 }}>{description}</p>

      <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 10, overflow: "hidden", border: `1px solid ${UI_TOKENS.borders.strong}` }}>
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
