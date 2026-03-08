import { InsightCard } from "./cards/MobileCards";
import UI_TOKENS from "../styles/tokens";

const SHIMMER_STYLE = {
  backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.03) 100%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.4s linear infinite",
};

function SkeletonLine({ width = "100%", height = 10, radius = 999 }) {
  return <div style={{ ...SHIMMER_STYLE, width, height, borderRadius: radius }} />;
}

export default function LoadingState({
  variant = "card",
  title = "Loading content",
  description = "Pulling the latest data and preparing your view.",
  rows = 3,
  className,
}) {
  const body = (
    <>
      <div style={{ color: UI_TOKENS.colors.textPrimary, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{title}</div>
      <div style={{ color: UI_TOKENS.colors.textMuted, fontSize: 11, marginTop: 6 }}>{description}</div>

      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        {variant === "media" ? (
          <>
            <SkeletonLine height={180} radius={12} />
            <SkeletonLine width="60%" />
            <SkeletonLine width="88%" />
          </>
        ) : variant === "chart" ? (
          <>
            <SkeletonLine width="45%" />
            <SkeletonLine height={160} radius={12} />
            <div style={{ display: "flex", gap: 8 }}>
              <SkeletonLine width="24%" />
              <SkeletonLine width="24%" />
              <SkeletonLine width="24%" />
            </div>
          </>
        ) : (
          Array.from({ length: rows }).map((_, idx) => <SkeletonLine key={idx} width={`${96 - idx * 8}%`} />)
        )}
      </div>
    </>
  );

  return (
    <InsightCard className={className}>{body}</InsightCard>
  );
}
