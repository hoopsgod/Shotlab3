import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../../shared/ui/EmptyState";
import LoadingState from "../../../shared/ui/LoadingState";
import ErrorState from "../../../shared/ui/ErrorState";
import UI_TOKENS from "../../../styles/tokens";

const DRILL_DETAIL_STYLE = {
  background: "rgba(12,17,22,0.9)",
  border: `1px solid ${UI_TOKENS.borders.subtle}`,
  borderRadius: UI_TOKENS.radii.lg,
  padding: UI_TOKENS.radii.lg,
  marginBottom: UI_TOKENS.spacing.md,
};

const FALLBACK_POSTER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 960 540'>
  <defs>
    <linearGradient id='g' x1='0' x2='1'>
      <stop offset='0%' stop-color='#121A28' />
      <stop offset='100%' stop-color='#1A2536' />
    </linearGradient>
  </defs>
  <rect width='960' height='540' fill='url(#g)' />
  <circle cx='190' cy='430' r='110' fill='rgba(63,95,151,0.22)' />
  <circle cx='750' cy='130' r='130' fill='rgba(63,95,151,0.18)' />
</svg>
`);

export default function DrillDetail({ title, description, videoUrl, thumbnailUrl, thumbnailAlt, videoCaption, techniqueTips = [] }) {
  const [mediaState, setMediaState] = useState(videoUrl ? "loading" : "empty");
  const [mediaNonce, setMediaNonce] = useState(0);
  const [hasThumbnailError, setHasThumbnailError] = useState(false);

  useEffect(() => {
    setMediaState(videoUrl ? "loading" : "empty");
    setHasThumbnailError(false);
  }, [videoUrl, mediaNonce]);

  useEffect(() => {
    if (!videoUrl || mediaState !== "loading") return undefined;
    const timeoutId = window.setTimeout(() => setMediaState((prev) => (prev === "loading" ? "error" : prev)), 8000);
    return () => window.clearTimeout(timeoutId);
  }, [mediaState, videoUrl, mediaNonce]);

  const thumbnailSrc = useMemo(() => {
    if (!thumbnailUrl || hasThumbnailError) return FALLBACK_POSTER;
    return thumbnailUrl;
  }, [thumbnailUrl, hasThumbnailError]);

  if (!videoUrl) {
    return (
      <EmptyState
        variant="drills"
        title={`${title} is almost ready`}
        description="Video is still being prepared. Try another drill now, then come back for this one shortly."
        ctaLabel="Browse available drills"
      />
    );
  }

  return (
    <article style={DRILL_DETAIL_STYLE}>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", color: UI_TOKENS.colors.primary, fontWeight: 700 }}>DRILL BREAKDOWN</div>
      <h3 style={{ margin: "6px 0 8px", color: UI_TOKENS.colors.textPrimary, fontSize: 18 }}>{title}</h3>
      <p style={{ margin: "0 0 10px", color: UI_TOKENS.colors.textSecondary, fontSize: 13, lineHeight: 1.5 }}>{description}</p>

      <figure style={{ margin: 0 }}>
        <div style={{ position: "relative", minHeight: 208, borderRadius: 10, overflow: "hidden", border: `1px solid ${UI_TOKENS.borders.strong}`, background: "rgba(10,15,25,0.82)" }}>
          <img
            loading="lazy"
            src={thumbnailSrc}
            alt={thumbnailAlt || `${title} drill thumbnail`}
            onError={() => setHasThumbnailError(true)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4, filter: "saturate(0.85)" }}
          />

          {mediaState === "loading" ? (
            <div style={{ position: "absolute", inset: 0, padding: 12 }}>
              <LoadingState variant="media" title="Loading film" description="Preparing coaching footage and overlays." />
            </div>
          ) : null}

          {mediaState === "error" ? (
            <div style={{ position: "absolute", inset: 0, padding: 12 }}>
              <ErrorState
                title="Video unavailable right now"
                description="Connection was interrupted while loading this drill clip. Retry, or continue with written coaching cues below."
                onRetry={() => {
                  setMediaState("loading");
                  setMediaNonce((n) => n + 1);
                }}
                secondaryLabel="Open on YouTube"
                onSecondaryAction={() => window.open(videoUrl, "_blank", "noopener,noreferrer")}
              />
            </div>
          ) : null}

          <iframe
            key={mediaNonce}
            title={`${title} instructional video`}
            src={videoUrl}
            loading="lazy"
            onLoad={() => setMediaState("ready")}
            onError={() => setMediaState("error")}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, opacity: mediaState === "ready" ? 1 : 0.01 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <figcaption style={{ marginTop: 8, color: UI_TOKENS.colors.textMuted, fontSize: 11, lineHeight: 1.4 }}>
          {videoCaption || `Instructional film for ${title}.`}
        </figcaption>
      </figure>

      <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "#8893A3", fontSize: 12, lineHeight: 1.5 }}>
        {techniqueTips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </article>
  );
}
