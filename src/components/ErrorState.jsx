import Card from "../shared/ui/Card";
import Button from "../shared/ui/Button";
import UI_TOKENS from "../styles/tokens";

export default function ErrorState({
  title = "Something went wrong",
  description = "We couldn’t load this section right now.",
  onRetry,
  retryLabel = "Retry",
  secondaryLabel,
  onSecondaryAction,
  className,
}) {
  return (
    <Card variant="empty" className={className}>
      <div
        style={{
          border: `1px solid ${UI_TOKENS.colors.danger}55`,
          borderRadius: 14,
          padding: 14,
          background: "linear-gradient(180deg, rgba(255,124,124,0.10), rgba(11,18,32,0.7))",
        }}
      >
        <div style={{ color: UI_TOKENS.colors.danger, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Load issue</div>
        <div style={{ color: UI_TOKENS.colors.textPrimary, fontSize: 14, fontWeight: 700, marginTop: 6 }}>{title}</div>
        <p style={{ color: UI_TOKENS.colors.textSecondary, fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>{description}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {onRetry ? <Button variant="primary" onClick={onRetry}>{retryLabel}</Button> : null}
          {secondaryLabel && onSecondaryAction ? <Button variant="tertiary" onClick={onSecondaryAction}>{secondaryLabel}</Button> : null}
        </div>
      </div>
    </Card>
  );
}
